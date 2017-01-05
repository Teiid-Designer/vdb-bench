### <p style="text-align: center">![Image of the import icon](images/ImportIcon.png "Import Data Service") Import Data Service Page</p>

This page can be used to add existing data services to your workspace. With this page wizard you can import a data service from either the file system or from a git repository. The first step of the wizard is to select which import source you want to use. Make your choice here:

<br />

![Image of source selection wizard step](images/DataServiceGitImportSelection.png "Select data service source step")

<br />

Once you select the import source type, click ![Image of the next button](images/NextButton.png "Next Button") to take you to the next step of the wizard. The next step is different depending on if you are [importing from a file system](dataservices-import-file-help.html) or importing from a git repository.

Since you've selected to perform a git repository import, the rest of this help page will talk about that type of import.

#### Import From A Git Repository 

When importing from a git repository, the next step in the wizard is to declare the properties of the repository you want to import from. You can do this by either selecting one of your saved repositories or by entering the repository properties directly. To chose a saved repository select one from this dropdown list:

<br />

![Image of the saved Git repositories dropdown](images/SavedGitRepositoriesDropdown.png "Saved Git Repositories list")

<br />

Once a saved repository is selected, its properties are used to populate the input fields. If the repository you want to import from does not exist, or you want to modify a property of a saved repository, you can enter or change properties in the input fields. Here is what the repository properties input fields look like:

<br />

![Image of the Git repository properties input fields](images/GitRepositoryProperties.png "Git Repository Properties")

<br />

Here's a description of those import repository properties: 

*   **Repository URL** - the URL of the git repository being imported from.
*   **Repository Branch** - the git repository branch (defaults to "master" if none is entered).
*   **Author Name** - not required for imports.
*   **Author Email Address** - not required for imports.
*   **Relative File Path** - the relative resource path, or just the name with extension, of the data service being imported. _Note: The file path must end in '.zip'._

In addition to the above properties, authentication properties are needed in order to access the git repository. You can either use SSH or HTTP authentication. If you are going to use SSH you can use either private key or password authentication. Here is what the SSH settings input fields look like:

<br />

![Image of the SSH authentication settings input fields](images/SshAuthenticationSettings.png "SSH Authentication Settings")

<br />

Here's a description of those SSH settings: 

*   **Known Hosts File** - the local file containing the SSH known hosts for either key-based or password authentication.
*   **Private Key File** - the file containing the SSH private key for key-based authentication.
*   **Passphrase** - the SSH passphrase for key-based authentication.
*   **Password** - the SSH password for password-based authentication.

If you choose to use the the HTTP settings, here is what those input fields look like:

<br />

![Image of the HTTP authentication settings input fields](images/HttpAuthenticationSettings.png "HTTP Authentication Settings")

<br />

Here's a description of the HTTP settings: 

*   **User Name** - the user name for the HTTP authentication to the git repository.
*   **Password** - the password for the HTTP authentication to the git repository.

_Note: For more information on how to enter Git repository information, and to persist Git repository information, see the [Git Repository Configurations Preferences](git-settings-help.html) page._

If all the repository properties are correct, click ![Image of the next button](images/NextButton.png "Next Button") to take you to the final step of the wizard. Here you will click the ![Image of the import button](images/ImportButton.png "Import Button") to perform the import. An indication if the import was successful (![Image of import success message](images/ImportExportSuccess.png "Import success")) or not (![Image of the import failed message](images/ImportExportFailed.png "Import failed")). Two reasons a file import might fail is (1) the file has an invalid file type, or (2) the file is a malformed archive file.

_Note: Data service files must have a '.zip' extension._

After completing the wizard, you will be taken back to the [Data Service Summary](dataservices-summary-help.html) page. The data services successfully imported by the wizard will now be showing here.





