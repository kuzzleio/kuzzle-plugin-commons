# Commons Plugin Classes

This repository contains common code used accross our plugins (either open source or enterprise).

Until the release 1.0.0, the code contained in this repository should be considered as unstable and breaking changes may occur between releases.

If you are interested by having a stable version of the classes contained in this repository feel free to upvote [this issue](https://github.com/kuzzleio/kuzzle-plugin-commons/issues/2)

## Engine

Works with engines that can be setup on indexes to bring a new set of feature to specifics indexes

  - `AbstractEngine`
  - `EngineController`

## Synchronizer

Automaticaly synchronize documents from one collection to another

  - `CollectionSynchronizer`

## Crud

Base controller to have CRUD action on a specific collection

- `CRUDController`
