# Challenge: Automation Workable Alert

## **Context**

MakerDAO has several jobs which require onchain automation. In interest of decentralisation they have built a [`Sequencer`](https://github.com/makerdao/dss-cron/blob/master/src/Sequencer.sol), in charge of supporting multiple Keeper Networks to work.

Keeper Networks will be required to watch the `activeJobs` array in the `Sequencer` and find all instances of available jobs. All jobs will be deployed contracts which implement the [`IJob`](https://github.com/makerdao/dss-cron/blob/master/src/interfaces/IJob.sol) interface.

## Contracts

Sequencer: https://etherscan.io/address/0x238b4E35dAed6100C6162fAE4510261f88996EC9#code

## Challenge goal

- Objective: Develop a long-running Node.js process using TypeScript that, upon the arrival of each new block, sends an alert (with details) if any currently active Maker job has been worked. Additionally, when the process starts, it should also check and notify if any jobs have been worked within the past 1,000 blocks.
- Deployment: Use Docker for the deployment.
- Notification: You should implement at least two way to notify the user. (We suggest Discord and Slack)

## Mandatory Requirements

You must utilize the following methods from the Sequencer contract:

- You must utilize the following methods from the Sequencer contract:
  - `numJobs()`
  - `jobAt(uint256 _index)`

- The solution must be implemented using **plain Node.js + TypeScript**, without relying on higher-level application frameworks (e.g. NestJS, Effect, etc.).

## Criteria

At Wonderland we strive for excellence in every single thing we do. That’s why while looking at your challenge, besides working correctly, we will also take into account:

- **Efficiency**: Can you reduce those RPC calls? 👀
- **Best practices**: Good error handling, a modular code structure, and overall awesome code.
- **Tests, tests, and tests**: You should at least write unit tests to cover the key functionalities.
- **Documentation**: Does your README explain how to run your project and what it does? Is your code clear and explained?

## Deliverables

A PR to this repository containing the developed code, including instructions on how to set up and run the application.

## Expectations

We expect this challenge to take between 10 to 16 hours of work.
