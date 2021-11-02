# Ceramic Data Model Explorer

An application for searching for DataModels for use with [Ceramic Network](https://ceramic.network/).

Try the [Online Demo](https://ceramic-explore.vercel.app/)

Watch the [Demo Video](https://youtu.be/DVUr74b9XdU)

View the [Documentation](https://ceramic-explore-docs.web.app/)

For the [Ceramic Network](https://ceramic.network/) task **Create A System For Discovery And/Or Curation Of DataModels** in the [Gitcoin Hackathon](https://gitcoin.co/issue/ceramicnetwork/ceramic/82/100026725).

View the repository for the [ExpressJS Backend Server](https://github.com/ben-razor/ceramic-model-explorer-server).

## About

Ceramic has an offical [datamodels repository](https://github.com/ceramicstudio/datamodels). The data model explorer makes Github API calls to get model information and schemas for display to the user.

The application also queries the NPM API to get download stats and active score.

When the user enters a search term, the model content (user name, tags, readme, etc.) are searched and the results displayed. The results can be sorted based on a number of parameters such as highest downloads or date added.

Users can also add datamodels from their own repositories so other can test and rate them prior to them being accepted into the official Ceramic repository.

Applications that use datamodels can be entered. This has a two-way benefit of allowing developers to more easily find useful datamodels, and also to find applications if they are looking for apps to use as a basis for a new application.

## Requested Features
* Upvote/downvote data models and schemas
* List of top rated data models
* List applications currently using a given data model package
* List data models by network usage popularity (package installs or streams created using the model)
* Search or explore existing data models based on key words, categories, application use cases, etc.
* An ability for developers to propose a change to an existing data model (directs user to Github discussion)
* A way for community members to vote and/or discuss the proposed change (directs user to Github discussion)
