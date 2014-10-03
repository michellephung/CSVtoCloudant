#READ ME
This is an application which lets you drag and drop a .csv file and then edit how it will be loaded into a Cloudant Database


To Use:

- Database must already exist on Cloudant
1. Drop in a CSV file from you computer
2. Enter your username, password, and the database name
3. 'Save'
4. 'Load'



Will Fail to Load if: 
- incorrect Name or Password or Database 




To Dos:

1. Currently, loading feedback (green text) will change to 'Success', after the first successful document is loaded into Cloudant. This should be re-written so that it changes to 'Success' after all docs are loaded into the db. 

2. Add a progress bar to first/second page when parsing large files. [Currently page is unresponsive while loading large files-- very noticable lag on csv file with 300+ rows]

3. Add option to override uuid as _id and instead select one of the columns as _id

4. Remove 'database' field from page 1, then on page 2, add dropdown for which database you want to load docs into
