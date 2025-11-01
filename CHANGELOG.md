# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](http://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Added `url` field to RAG documents schema to support external content references
- Documents can now store content directly or reference a URL from where to fetch the content
- Made `content` field optional to allow documents with only URL references

### New

- Initial implementation
