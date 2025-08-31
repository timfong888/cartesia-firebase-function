---
type: "agent_requested"
description: "deploy firebase function"
---
**always** deploy in a way that will not delete other functions:

`firebase deploy --only functions:functionName`

after **success** indicate a deployment in the github repository that is the source.

