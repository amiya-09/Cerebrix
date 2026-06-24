# Cerebrix

A quick explanation of why these four tables, and how they relate:

-[x] Conversations — one row per chat session. Tracks whether it's still open, resolved automatically, or escalated to a human.
-[x] Messages — one row per individual message (both what the user typed and what the AI replied). Each one points back to its parent conversation via conversation_id.
-[x] Kb_articles — the human-readable record of what's in your knowledge base (the actual searchable vectors live separately in Chroma DB — this table is just for displaying/managing articles in the UI later).
-[x] Review_queue — whenever the AI isn't confident enough to answer automatically, a row goes here with its draft answer, waiting for a human to approve or edit it.