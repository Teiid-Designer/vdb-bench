### <p style="text-align: center">![Image of the export icon](images/ExportIcon.png "Export Data Service") Export Data Service Page</p>

This page is used to export data services from your workspace. With this page wizard you can export the selected data service to either the file system or to a git repository. The first step of the wizard is to select which export type you want to use. Make your choice here:

<br />

![Image of export type selection wizard step](images/DataServiceGitExportSelection.png "Select data service export type step")

<br />

Once you select the export type, click ![Image of the next button](images/NextButton.png "Next Button") to take you to the next step of the wizard. The next step is different depending on if you are [exporting to the file system](dataservices-export-git-help.html) or exporting to a git repository.

Since you've selected to perform a git repository export, the rest of this help page will talk about that type of export.

#### Export To Git Repository 

The next step in the wizard is to declare the properties of the repository you want to export to. You can do this by either selecting one of your saved repositories or by entering the repository properties directly. To chose a saved repository select one from this dropdown list:

<br />

![Image of the saved Git repositories dropdown](images/SavedGitRepositoriesDropdown.png "Saved Git Repositories list")

<br />

Once a saved repository is selected, its properties are used to populate the input fields. If the repository you want to import from does not exist, or you want to modify a property of a saved repository, you can enter or change properties in the input fields. Here is what the repository properties input fields look like:

<br />

![Image of the Git repository properties input fields](images/GitRepositoryProperties.png "Git Repository Properties")

<br />

Here's a description of those import repository properties: 

*   **Repository URL** - the URL of the git repository being exported to.
*   **Repository Branch** - the git repository branch (defaults to "master" if none is entered).
*   **Author Name** - the name of the person performing the export. This is a _git commit_ operation.
*   **Author Email Address** - the email of the person performing the export.
*   **Relative File Path** - the relative resource path, or just the name with extension, of the data service being exported. _Note: The file path must end in '.zip'._

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

If all the repository properties are correct, click ![Image of the next button](images/NextButton.png "Next Button") to take you to the final step of the wizard. Here you will click ![Image of the export button](images/ExportButton.png "Export Button") to perform the export. An indication if the export was successful (![Image of export success message](images/ImportExportSuccess.png "Export success")) or not (![Image of the export failed message](images/ImportExportFailed.png "Export failed")).  If an export fails, check to make sure you entered the correct repository properties and authentication settings.

After completing the wizard, you will be taken back to the [Data Service Summary](dataservices-summary-help.html) page.

