ORIGINAL

Concept: Posting (User, Image)

* purpose
    allow users to publish and share content for others to see
* principle
    users can create/publish posts that consist of a caption and at least one image. These posts can be edited and deleted by their owners.
* state
    a set of Posts with
        a caption String
        a set of Images
        an author User
* actions
    create (user: User, images: Set<Image>, caption: String): (post: Post) 
        requires 
            user to exist, images cannot be empty
        effects 
            creates a new post authored by the user with its content being the caption and images given
    delete (post: Post):
        requires
            post to exist
        effects
            deletes the post for the author and their friends
    edit (post: Post, new_caption: String): (post: Post) 
        requires
            post to exist
        effects
            edits the caption of the post to be that of the new one

AI-AUGMENTED

Concept: Posting (User, Image)

* purpose
    allow users to publish and share content for others to see, with optional AI support for generating captions to invoke more discussion
* principle
    users can create/publish posts that consist of a caption and at least one image. These posts can be edited and deleted by their owners. AI suggestions
    for writing captions is provided and based on a user's caption draft.
* state
    a set of Posts with
        a caption String
        a set of suggestions Strings
        a set of Images
        an author User
* actions
    create (user: User, images: Set<Image>, caption: String): (post: Post) 
        requires 
            user to exist, images cannot be empty
        effects 
            creates a new post authored by the user with its content being the caption and images given
    delete (post: Post):
        requires
            post to exist
        effects
            deletes the post for the author and their friends
    edit (post: Post, new_caption: String): (post: Post) 
        requires
            post to exist
        effects
            edits the caption of the post to be that of the new one
    async suggestionCaptionAI (llm: GeminiLLM, user_caption: String): (alternative_captions: List<String>)
        requires
            user_caption cannot be empty
        effects
            generates a list of alternative captions based on the draft caption. Does not modify the draft_caption itself.
    applySuggestion (post: Post, suggestion: String)
        requires
            post to exist, suggestion cannot be empty
        effects
            modifies the caption of the post to be the suggestion String