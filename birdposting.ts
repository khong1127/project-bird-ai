/**
 * BirdPosting - AI-augmented posting prototype
 */

import { GeminiLLM } from './gemini-llm';

export interface Post {
    // Only the caption draft is required for this prototype — we focus on caption editing and suggestions.
    caption: string;
    // AI-provided alternative captions
    suggestions?: string[];
}

export class BirdPosting {
    private posts: Post[] = [];

    addPost(caption: string): Post {
        const post: Post = { caption };
        this.posts.push(post);
        return post;
    }

    // Update the post's caption directly with a new caption string (simulates user applying a suggestion)
    editPost(post: Post, newCaption: string): Post | undefined {
        const idx = this.posts.indexOf(post);
        if (idx === -1) return undefined;  // handles precondition

        this.posts[idx].caption = newCaption;
        // Clear suggestions after a manual edit (user applied or updated caption)
        this.posts[idx].suggestions = undefined;
        return this.posts[idx];
    }

    // Apply a suggestion by index (simulates the user choosing an alternative from the suggestions list)
    applySuggestion(post: Post, suggestionIndex: number): Post | undefined {
        const idx = this.posts.indexOf(post);
        if (idx === -1) return undefined;
        const suggestions = this.posts[idx].suggestions;
        if (!suggestions || suggestionIndex < 0 || suggestionIndex >= suggestions.length) return undefined;
        this.posts[idx].caption = suggestions[suggestionIndex];
        // Clear suggestions after applying one
        this.posts[idx].suggestions = undefined;
        return this.posts[idx];
    }

    /**
     * Use the LLM to generate caption suggestions for the post.
     * The model should return a JSON object with `suggestions`: an array of 3 short caption strings.
     */
    async augmentPostWithLLM(llm: GeminiLLM, post: Post): Promise<void> {
        try {
            const prompt = this.createAugmentationPrompt(post);
            console.log(`\n🤖 Requesting caption suggestions for post (caption preview: "${post.caption.slice(0,40)}") from Gemini AI...`);

            const text = await llm.executeLLM(prompt);

            console.log('✅ Received response from Gemini AI!');
            console.log('\n🤖 RAW GEMINI RESPONSE');
            console.log('======================');
            console.log(text);
            console.log('======================\n');

            // Parse and apply suggestions using helper
            this.parseAndApplySuggestions(text, post);

            console.log(`✅ Stored 3 suggestion(s) for post (caption preview: "${post.caption.slice(0,40)}")`);
        } catch (error) {
            console.error('❌ Error calling Gemini API:', (error as Error).message);
            throw error;
        }
    }

    /**
     * Parse raw LLM text for a JSON object and apply suggestion normalization to the post.
     * This mirrors the DayPlanner pattern of extracting parsing/apply logic into a helper.
     */
    private parseAndApplySuggestions(text: string, post: Post): void {
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            throw new Error('No JSON found in LLM response');
        }

        const response = JSON.parse(jsonMatch[0]);

        if (response.suggestions && Array.isArray(response.suggestions)) {
            // Normalize to strings, trim, and ensure non-empty
            const suggestions: string[] = response.suggestions
                .map((s: any) => String(typeof s === 'string' ? s : (s.caption ?? '')).trim())
                .filter((s: string) => s.length > 0);

            // Expect exactly 3 unique suggestions per prompt; enforce uniqueness
            const unique = Array.from(new Set(suggestions)).slice(0, 3);
            if (unique.length < 3) {
                throw new Error('LLM did not provide 3 unique suggestions');
            }

            // Run validators to catch common LLM issues (hallucination, formatting, etc.)
            this.validateSuggestions(unique, post.caption);

            post.suggestions = unique;
        } else {
            throw new Error('LLM response did not include valid suggestions');
        }
    }

    /**
     * Validators for LLM-generated suggestions.
     * Throws an Error if any validation fails.
     */
    private validateSuggestions(suggestions: string[], draft: string): void {
        // 1) Schema & uniqueness already enforced earlier: length == 3
        if (suggestions.length !== 3) {
            throw new Error('Validator: suggestions length is not 3');
        }

        // 2) No hallucinated dates/numeric facts not in draft
        const draftLower = draft.toLowerCase();
        const monthRegex = /\b(?:january|february|march|april|may|june|july|august|september|october|november|december)\b/i;
        const yearRegex = /\b\d{4}\b/;
        const digitRegex = /\b\d{1,4}\b/;

        for (const s of suggestions) {
            // If suggestion contains a month or year or standalone number that is NOT present in draft, flag it
            if (monthRegex.test(s) && !monthRegex.test(draftLower)) {
                throw new Error('Validator: suggestion appears to introduce a month/date not present in the draft');
            }
            if (yearRegex.test(s) && !yearRegex.test(draftLower)) {
                throw new Error('Validator: suggestion appears to introduce a year not present in the draft');
            }
            // stand-alone digits (like counts/dates) are suspicious unless present in draft
            const digits = s.match(digitRegex);
            if (digits && !draftLower.match(digitRegex)) {
                throw new Error('Validator: suggestion introduces numeric facts not present in draft');
            }
        }

        // 3) Heuristic for proper-noun hallucination: detect capitalized words not in draft
        //    This flags likely invented entities (places, people) the model added.
        const draftWords = new Set(draft.split(/\W+/).map(w => w.toLowerCase()).filter(Boolean));
        const properNounRegex = /\b([A-Z][a-z]{2,})\b/g; // words starting with capital letter
        for (const s of suggestions) {
            let m: RegExpExecArray | null;
            while ((m = properNounRegex.exec(s)) !== null) {
                const word = m[1];
                // skip if the lowercase form appears in the draft
                if (draftWords.has(word.toLowerCase())) continue;
                // skip months
                if (/^(January|February|March|April|May|June|July|August|September|October|November|December)$/.test(word)) continue;

                const idx = m.index;

                // Find the previous non-space character (if any)
                let prevNonSpace: string | undefined = undefined;
                for (let i = idx - 1; i >= 0; i--) {
                    const ch = s[i];
                    if (ch !== ' ' && ch !== '\t' && ch !== '\n' && ch !== '\r') { prevNonSpace = ch; break; }
                }

                // Determine sentence-start: either at index 0, or previous non-space char is punctuation or symbol (handles emoji)
                let isSentenceStart = false;
                if (idx === 0) {
                    isSentenceStart = true;
                } else if (!prevNonSpace) {
                    isSentenceStart = true;
                } else {
                    // If previous non-space char is not alphanumeric, treat it as punctuation/symbol (covers emoji)
                    if (!/[A-Za-z0-9]/.test(prevNonSpace)) {
                        isSentenceStart = true;
                    } else {
                        // fallback: treat explicit punctuation as sentence boundary
                        if (/[.!?]/.test(prevNonSpace)) isSentenceStart = true;
                    }
                }

                // If it's a sentence-start capitalized word, treat it as safe
                if (isSentenceStart) continue;

                // Otherwise, flag it as a potential hallucinated proper noun
                throw new Error('Validator: suggestion introduces a proper noun (possible hallucination) not present in draft');
            }
        }

        // 4) Sentence length / complexity: no more than 2 sentences per suggestion
        // Count sentence-like fragments but ignore fragments that have no word characters (this avoids counting emoji-only fragments)
        for (const s of suggestions) {
            const rawParts = s.split(/[.!?]+/);
            const sentenceCount = rawParts.filter(p => /\w/.test(p)).length || 0;
            if (sentenceCount > 2) {
                throw new Error('Validator: suggestion contains more than 2 sentences');
            }
        }
    }

    private createAugmentationPrompt(post: Post): string {
        return `You are an assistant that helps birdwatchers craft engaging social captions from a user's draft.

        The user has already written a caption draft. Using the draft as the primary input, produce 3 concise (MUST BE 1-2 sentences long), unique, alternative caption suggestions that:
        - Improve clarity and flow
        - Increase engagement (use friendly hooks, invite comments, or include a light call-to-action)
        - Preserve factual content from the user's draft (do not invent new facts)

        Return ONLY a JSON object with this shape:
        {
            "suggestions": ["caption suggestion 1", "caption suggestion 2", "caption suggestion 3"]
        }

        POST DETAILS:
        User caption draft: ${post.caption}

        Notes:
        - Do not add fictional details.
        - Preserve the tone of the original caption. E.g if the original uses slang, preserve that
        - Prefer conversational, shareable phrasing that encourages interaction.
        `;
    }

    displayPosts(): void {
        console.log('\n🪶 Bird Posts');
        console.log('====================');
        if (this.posts.length === 0) {
            console.log('No posts yet.');
            return;
        }

        for (const post of this.posts) {
            console.log(`\nCaption (user draft): ${post.caption}`);
            if (post.suggestions && post.suggestions.length > 0) {
                console.log('\n💡 AI Suggestions (alternatives):');
                post.suggestions.forEach((s, i) => console.log(`${i + 1}. ${s}`));
            }
            console.log('--------------------');
        }
    }
}
