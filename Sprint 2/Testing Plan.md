## Testing Goals and Scope  

#### frontend 
For the frontend we are testing the navigation logic as well as the state of the role of the user. We are testing to make sure users are logged into the propper portal and are not shown the impropper dashboard/job creation page. In the future it will make for a much easier time detecting when the backend requests are not being formatted the way the backend is expecting them to be formatted.

#### backend 
The backend serves as the backbone of our entire project, if we do not have known and consistent behaviour within every function it can lead to issues within all other pieces of the project. The backend is tested both with unit tests and with integration tests to make sure it behaves in the ways we expect it to. The backend testing is structured to be quite bite sized as the functionality of the backend is split up into atomic units which can be individually tested, leading to great consistencyas development continues.

---

## Testing Frameworks and Tools
We use mainly Jest for frontend and backend testing and Playwright for acceptance/end to end testing. Jest integrates very well with our React environment as is very well suited to front end testing due to how easy it is to set up and tear down tests and add in new tests, Jest also makes it incredibly easy to run tests with coverage to let us know where to focus our efforts. Playwright is great for whole-system tests as it actually simulates the entire project in a chromium environment and allows for things like alerts to be simulated and actually shown/clicked. Playwright made for a very simple and fast test of the registration and login features due to how 1 to 1 the test is with the real use of the website.

---

## Test Organization and Structure  
Our test suite is a touch scattered accross the backend, frontend and the acceptance tests. In all cases our tests are in a \_\_tests__ folder, one in root, /frontend/src/\_\_tests__, /backend/src/\_\_tests__/UnitTests and /backend/src/\_\_tests__/Integration Tests.

---

## Coverage Targets  
We are aiming for quite high coverage of both logic and backend functions, currently both the frontend and backend are hitting just about 80% coverage and we aim to increase that for sprint 2.

---

## Running Tests  
Include exact commands or scripts for running each type of test and generating coverage reports, so others can easily reproduce your results.
By default our tests run with coverage for frontend and backend, playwrite generates a coverage report which can be viewed
Example:
```bash
#For frontend in the /frontend folder run:
npm run test

#For backend in the backend folder run:
npm run test

#For acceptance tests in the root folder run:
npm run test
```

---

## Reporting and Results  
For backend and frontend tests the coverage reports are all printed into the console, but can also be found in /backend/coverage, similarly for frontend /frontend/coverage and for acceptance tests in the root there is the /test-results folder

---

## Test Data and Environment Setup  
The testing setup is outlined in the README.md under "Setting up the Project", after running the setup script the suite is ready to be run.

---

## Quality Assurance and Exceptions  
Currently a chunk of our frontend cookie and authentication token behaviour is not being tested, we have deprioritized this behaviour to focus on fundamental functionality and connectivity. We recieve updates after each push onto the branch about the results of our test suite and are aware of the tests that are currently causing a few issues and they are next in line to be fixed. Also due to a large influx of frontend pages those have not yet been tested due to the time constaints of Sprint 2.

---

## Continuous Integration
We do use github actions and that is our only Continuous Integration step, we run the front end, backend, acceptance and linting steps and recieve a report emailed to us to let us know what is running well or not.
