/**
 * BirdPosting Test Cases
 * 
 * Demonstrates both manual and LLM-assisted caption writing
 */
import { BirdPosting } from './birdposting';
import { GeminiLLM, Config } from './gemini-llm';

/**
 * Load configuration from config.json
 */
function loadConfig(): Config {
    try {
        const config = require('../config.json');
        return config;
    } catch (error) {
        console.error('❌ Error loading config.json. Please ensure it exists with your API key.');
        console.error('Error details:', (error as Error).message);
        process.exit(1);
    }
}

/**
 * Test case 1: Manual posting
 * Demonstrates adding caption drafts and displaying them
 */
export async function testManualPosting(): Promise<void> {
    console.log('\n🧪 TEST CASE 1: Manual Posting');
    console.log('================================');

    const bp = new BirdPosting();

    console.log('📝 Adding caption drafts...');
    bp.addPost('Saw a group of shorebirds at low tide.');
    bp.addPost('A colorful visitor stopped by the feeder for a quick snack.');

    console.log('\n📋 Displaying posts:');
    bp.displayPosts();
}

/**
 * Test case 2: Mixed editing (LLM suggestions + manual tweaks)
 */
export async function testMixedEditing(): Promise<void> {
    console.log('\n🧪 TEST CASE 2: Mixed Editing (LLM + manual)');
    console.log('==========================================');

    const config = loadConfig();
    const llm = new GeminiLLM(config);

    const bp = new BirdPosting();
    const p1 = bp.addPost('Spotted a raptor scanning the water for fish.');
    const p2 = bp.addPost('Enjoyed the dawn chorus near the old oak this morning.');

    console.log('\n📋 Before augmentation:');
    bp.displayPosts();

    console.log('\n📍 Now augmenting post 1! (Spotted a raptor scanning the water for fish.)');

    // Augment posts with AI suggestions
    await bp.augmentPostWithLLM(llm, p1);

    // Simulate user applying first suggestion and then tweaking
    if (p1.suggestions && p1.suggestions.length > 0) {
        console.log('\n🧑‍💻 Applying suggestion 1 for post 1, then tweaking');
        bp.applySuggestion(p1, 0);
        bp.editPost(p1, p1.caption + ' ' + 'Anyone else see this today?');
    }

    console.log('\n📍 Now augmenting post 2! (Enjoyed the dawn chorus near the old oak this morning.)');

    await bp.augmentPostWithLLM(llm, p2);

    if (p2.suggestions && p2.suggestions.length > 0) {
        console.log('\n🧑‍💻 Applying suggestion 1 for post 2, then tweaking');
        bp.applySuggestion(p2, 0);
        bp.editPost(p2, p2.caption + ' ' + 'Share your sunrise photos!');
    }

    console.log('\n📋 After augmentation:');
    bp.displayPosts();
}

/**
 * Test case 3: Pure LLM augmentation (apply alternatives without manual tweaks)
 */
export async function testLLMAugmentation(): Promise<void> {
    console.log('\n🧪 TEST CASE 3: Pure LLM Augmentation');
    console.log('======================================');

    const config = loadConfig();
    const llm = new GeminiLLM(config);

    const bp = new BirdPosting();
    const p1 = bp.addPost('Spotted a raptor scanning the water for fish.');
    const p2 = bp.addPost('Enjoyed the dawn chorus near the old oak this morning.');

    console.log('\n📋 Before augmentation:');
    bp.displayPosts();

    console.log('\n📍 Now augmenting post 1! (Spotted a raptor scanning the water for fish.)');

    // Augment posts with AI suggestions
    await bp.augmentPostWithLLM(llm, p1);

    // Apply the first suggestion for both posts without manual tweaks
    if (p1.suggestions && p1.suggestions.length > 0) {
        console.log('\n🧑‍💻 Applying suggestion 1 for post 1 (no manual tweak)');
        bp.applySuggestion(p1, 0);
    }

    console.log('\n📍 Now augmenting post 2! (Enjoyed the dawn chorus near the old oak this morning.)');

    await bp.augmentPostWithLLM(llm, p2);

    if (p2.suggestions && p2.suggestions.length > 0) {
        console.log('\n🧑‍💻 Applying suggestion 1 for post 2 (no manual tweak)');
        bp.applySuggestion(p2, 0);
    }

    console.log('\n📋 After pure LLM augmentation:');
    bp.displayPosts();
}

/**
 * Experiment 1: LLM augmentation based off of a vague caption
 */
export async function testVagueDraftCaption(): Promise<void> {
    console.log('\n🧪 EXPERIMENT 1: LLM Augmenting off a Vague Caption');
    console.log('==========================================');

    const config = loadConfig();
    const llm = new GeminiLLM(config);

    const bp = new BirdPosting();
    const p1 = bp.addPost('Nice birds');

    console.log('\n📋 Before augmentation:');
    bp.displayPosts();

    // Augment posts with AI suggestions
    await bp.augmentPostWithLLM(llm, p1);

    // Simulate user applying first suggestion and then tweaking
    if (p1.suggestions && p1.suggestions.length > 0) {
        console.log('\n🧑‍💻 Applying suggestion 1 for post 1 (no manual tweak)');
        bp.applySuggestion(p1, 0);
    }

    console.log('\n📋 After augmentation:');
    bp.displayPosts();
}

/**
 * Experiment 2: LLM augmentation based off casual caption
 */
export async function testCasualCaption(): Promise<void> {
    console.log('\n🧪 EXPERIMENT 2: LLM Augmenting off a Casual Caption');
    console.log('==========================================');

    const config = loadConfig();
    const llm = new GeminiLLM(config);

    const bp = new BirdPosting();
    const p1 = bp.addPost('lol the bird kept trying to steal my fries');

    console.log('\n📋 Before augmentation:');
    bp.displayPosts();

    // Augment posts with AI suggestions
    await bp.augmentPostWithLLM(llm, p1);

    // Simulate user applying first suggestion and then tweaking
    if (p1.suggestions && p1.suggestions.length > 0) {
        console.log('\n🧑‍💻 Applying suggestion 1 for post 1 (no manual tweak)');
        bp.applySuggestion(p1, 0);
    }

    console.log('\n📋 After augmentation:');
    bp.displayPosts();
}

/**
 * Experiment 3: LLM augmentation based off a caption that points to photos generically
 */
export async function testSadderCaption(): Promise<void> {
    console.log('\n🧪 EXPERIMENT 3: LLM Augmenting off a Caption with Sadder Tones');
    console.log('==========================================');

    const config = loadConfig();
    const llm = new GeminiLLM(config);

    const bp = new BirdPosting();
    const p1 = bp.addPost('Didn\'t get to see too many birds because of the cloudy weather today...');

    console.log('\n📋 Before augmentation:');
    bp.displayPosts();

    // Augment posts with AI suggestions
    await bp.augmentPostWithLLM(llm, p1);

    // Simulate user applying first suggestion and then tweaking
    if (p1.suggestions && p1.suggestions.length > 0) {
        console.log('\n🧑‍💻 Applying suggestion 1 for post 1 (no manual tweak)');
        bp.applySuggestion(p1, 0);
    }

    console.log('\n📋 After augmentation:');
    bp.displayPosts();
}

/**
 * Main function to run all test cases
 */
async function main(): Promise<void> {
    console.log('🎓 BirdPosting Test Suite');
    console.log('========================\n');

    try {
        await testManualPosting();
        await testMixedEditing();
        await testLLMAugmentation();

        console.log('\n🎉 All tests completed successfully!');
    } catch (error) {
        console.error('❌ Test error:', (error as Error).message);
        process.exit(1);
    }
}

// Run the tests if this file is executed directly
if (require.main === module) {
    main();
}

