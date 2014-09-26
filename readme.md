#READ ME
An application which lets drag and drop .csv file into a Cloudant Database

To Do:

1. Currently, loading feedback (green text) will change to 'Success', after the first successful document is loaded into Cloudant. This should be re-written so that it changes to 'Success' after all docs are loaded into the db.

2. Add a progress bar to first/second page when parsing large files. [Currently page is unresponsive while parsing file-- very noticable on csv file with 300+ rows]