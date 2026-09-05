# Commands

Every scene edit is a `Command { do, undo }` run through `useHistory().run(cmd)`. See `entityCommands.ts`.
When the database lands, each command additionally calls `api.*` and writes the events table — here, nowhere else.
