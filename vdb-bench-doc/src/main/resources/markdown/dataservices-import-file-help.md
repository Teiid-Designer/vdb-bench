### <p style="text-align: center">![Image of the import icon](images/ImportIcon.png "Import Data Service") Import Data Service Page</p>

This page can be used to add existing data services to your workspace. With this page wizard you can import a data service from either the file system or from a git repository. The first step of the wizard is to select which import source you want to use. Make your choice here:

<br />

![Image of source selection wizard step](images/DataServiceFileImportSelection.png "Select data service source step")

<br />

Once you select the import source type, click ![Image of the next button](images/NextButton.png "Next Button") to take you to the next step of the wizard. The next step is different depending on if you are importing from a file system or [importing from a git repository](dataservices-import-git-help.html).

Since you've selected to perform a file import, the rest of this help page will talk about that type of import.

#### Import From File System 

When importing from the file system, the wizard allows you to import one or more data service archive (*.zip) files. Step 2 when importing a file looks like this:

<br />

![Image of the import file wizard step](images/DataServiceImportFileStep.png "Import the data service file step")

<br />

Click ![Image of the browse button](images/BrowseButton.png "Browse") to display the file chooser dialog and select the file you want to import. After the file chooser closes there will be an indication if the import was successful (![Image of import success message](images/ImportExportSuccess.png "Import success")) or not (![Image of the import failed message](images/ImportExportFailed.png "Import failed")). Two reasons a file import might fail is (1) the file has an invalid file type, or (2) the file is a malformed archive file.

_Note: Data service files must have a '.zip' extension._

You can import additional data services by using the file chooser again before hitting ![Image of the finish button](images/FinishButton.png "Finish").

After completing the wizard, you will be taken back to the [Data Service Summary](dataservices-summary-help.html) page. The data services successfully imported by the wizard will now be showing here.

