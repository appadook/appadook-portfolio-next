# Convex functions

See [backend architecture](../README.md) and [rollout instructions](../../../DEPLOYMENT.md).

Every new private query, mutation or action must call `requireOwner`. Content mutations must use `prepareWrite` to validate fields, freeze the initial publication and enforce optimistic versions. Public queries must read `readPublished`, never the draft tables. Internal functions remain inaccessible to public clients but must preserve identity when invoked by an owner action.
