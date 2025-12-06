# Sprint 3 Worksheet

# [HiveHand] (https://hivehand-frontend.ambitiousflower-23c258c4.westus2.azurecontainerapps.io/)

## Load Testing

Using JMeter, the .jmx file [HERE](https://github.com/AnnaP464/COMP-4350-Group-8/blob/main/Sprint%203/HiveHand%20LoadTesting.jmx)

## Security Analysis

We used SonarQube to run the security analysis. 
In terms of Security vulnurabilites none were found. It did highlight many maintainance & reliability issues.

Overall Report:

![alt text](SonarQubeReport.png)

All Security Hotspot issues are the hardcoded passwords in the test suite that are used for login.

Coverage does not register due to unknown reasons even though the coverage folder has been updated with the latest test, this is also the reason the overall assessment is set to Failed.

Before removing comments:

![alt text](WithComments.png)

After:

![alt text](WithoutComments.png)

Here are the commits for resolving said comment issues

[Commit 1](https://github.com/AnnaP464/COMP-4350-Group-8/commit/16876c7122542fc2ae431547e03511a6b4a35c60) & [Commit 2](https://github.com/AnnaP464/COMP-4350-Group-8/actions/runs/19971862935)

And here is a fix for cognitive complexity being evaluated as too high for a function.

[Commit](https://github.com/AnnaP464/COMP-4350-Group-8/commit/f67385704308405a9387f131b9bfc399bdb7f7db)

## Continuous Integration & Deployment

## Reflections

### Design Changes

  In one paragraph (as a group): What would you change about the design of your project now that you’ve been through development?

Im not sure what to speak on in terms of big changes?

Anna P - I think mapping out the frontend structure before beginning of development would have prevented the need for the refactors that came later.

### Project Setup Changes

In one paragraph (as a group): What would you change about the course/project setup?

  Requirements?

  Check-ins?

  Process changes?

Our work setup has always relied on in person or discord meetings to assign tasks and summarize the state of the repo. The Largest changes to the project's scope came after sprint 1 when we scaled back the feature set quite a bit to rely less on third party technology like blockchain and to focus on building the skeleton of the app first and foremost.

The branch management strategy of sprint 1 did not last into sprints 2 & 3. There were a few collisions & instances of double work that made us reconsider how we update eachother on what features are being handled and we started to rely more on github issues to make sure we are aware of the project state before beginning development of the next feature.

### Individual AI / External Resource Reflection

Required: one clearly labeled paragraph per team member, even if you did not use AI.

  If you used AI or external references: Given an example of a problem you tried to solve, what did the tool produce (summary is fine), and what did you rewrite, validate, or learn from its response?

  If you did not use AI: Why not? What influenced that choice, and how did you approach problem-solving instead?

  Length guideline: approximately 5–8 sentences. Focus only on your own actions and understanding.

#### Anna P
The AI I used is ChatGPT 5.0, I relied on AI to help me learn how to create the .yml files for CI using Github Actions. The code it produced can be seen in out technique sharing seminar and overall it made tons of assumptions about the structure of our code that were not supported by anything, including assuming the paths that it chose to ping, the way that it eventually sudgested caching of an install of Playwright on a docker image in CI. and similar changes that did not help with the real issue of it trying to ping a path that did not exist. The second attempt at fixing the .yml file was much more fruitful due to writing the file myself and arranging all of the pieces of the workflow myself and only using AI to help parse Azure Server's Error messages, along with minor code sudgestions. The second attempt was a lot faster due to becoming familiar with Docker, I think AI cant bridge this knowledge gap due to how opaque the project is to it, not unless I were to dump the entire repository into the chat window.
