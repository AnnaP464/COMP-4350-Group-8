

# HiveHand
#### Helping hands in a hive

### Project Summary

HiveHand will allow people looking to volunteer to find oppertunities to help out with in the community. HiveHand will assist both the organizers and volunteers by easing the selection process for volunteer jobs and will gameify the process of volunteering to make it more enjoyable. 

The goal of HiveHand is to help connect people with in the community and create an environment for networking. Currentlyif you want to volunteer for any given reason you need to seek out organization that offer a specific activity, usually on their own website, making for a very cluttered experience and slowing down the process for both volunteers and organizers, and ultimately limiting the amount of people participating.

HiveHand will be a hub that will allow a large number of both volunteers and activity postings to circulate, and help people with tracking those activities in an efficent interface focused on clarity and ease of use.

### Core Features & Acceptance Criteria

1) Have a profile available for all users, both volunteers and organizers will have profiles that have a small description of the type of work offered for organizers, upcomming events, contact information and a history of past jobs done for volunteers.

- A running total of all the activities will be viewable within seconds of and all the information from previous jobs will be available in case the user wants to work with an organizer again.

2) Organizers should be able to create a volunteer listing with a description of the job, location, time, and an upper bound for the amount of help needed. These listings would become visible to potential volunteers and pop up if searched for or in a queue of upcoming events. A volunteer will be able to sign up if there are slots available as well as recind their application if a scheduling error comes up. 
- For a reliable searching experience we expect the result to load within a few seconds to maintain a smooth browsing experince, and an updated list of tasks. Aswell as making sure to provide visibility to organizers quickly.

3) A map to display tasks with in the local area. A widget or a page to display pins to help volunteers choose their tasks based on ease of access and let organizers clarify where they are holding the event.
- a working updated map you can view. It is updated as tasks are created.

4) We hope to scale the application to be able to handle a high throughput of traffic and be able to handle spikes in activity without degrading service significantly.
- A goal for our final itteration will be 100 users and 1000 concurrent requests per minute

### Additional Features

1) The hours that volunteers are working would be tracked and as jobs are completed it would give users a sense of where they are in regards to their personal volunteering goals.
- a simple ui element that adds up the hours 

### User Stories

1) As a volunteer I want to search through the available postings to see if they line up with my schedule, this would help me make sure that i can adapt my schedule. 

2) As an organizer I want to see the status of the activity at a glance so that i will know how many people will show up, this will aid in planning for additional help if necessary.

3) As a volunteer I want to be able to see my history of attended postings, this would help me keep track of my hours volunteered.

### Tech Stack

##### Front End 
React - Our team has previous experience with React and similar technology (Angular).

##### Back End
Next.js - It has types, which keeps code more structured, it will keep the language we use consistent between the front end and back end. And some of us have previous expereince with angular which next.js is based on.

##### Database
PostgreSQL - Our team has previous experience with relational databases and SQL has similar syntax across versions.

##### Testing Formatting/Unit/Integration Tests
Formatting - Github Triggers/Hooks - The project is already hosted on github, it makes sense to take advantage of the triggers and hooks to help automate the formatting, testing and building.

Integration & Unit Testing - Jest - An all in one framework for javascript testing, that will take care of most of our needs without a need for other programs.

### Work Coordination
Our group has settled on using discord to maintain a common idea of the project as well as call when we want to discuss a potential change of plans or upcoming deadline. Google Docs works well when it comes to more informal documents that are not submission-critical. 

We have so far allocated work based on personal interest, and personal experience. Making sure to clear up who is assigned what during inperson or online meetings. When we begin implementing the application, assigning github issues will be a potential way for us to keep track of which feature resides with each of us.
