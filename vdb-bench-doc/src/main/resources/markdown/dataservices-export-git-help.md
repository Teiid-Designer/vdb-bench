### <p style="text-align: center">![Image of the export icon](images/ExportIcon.png "Export Data Service to Git") Export Data Service to Git Repository</p>

This wizard is used to export data services from your workspace to a git repository. 

#### Step 1 : Repository Properties

The first step of the wizard is to declare the properties of the git repository you want to export to. You can do this by either selecting one of your saved repositories or by entering the repository properties directly. To chose a repository select one from the dropdown list:

<br />
![Image of the Git repositories dropdown](images/SavedGitRepositoriesDropdown.png "Saved Git Repositories list")

Once a repository is selected, its properties are used to populate the input fields.  You can enter or change properties in the input fields. Here is what the repository property input fields look like:

<br />
![Image of the Git repository properties input fields](images/GitRepositoryProperties.png "Git Repository Properties")
<br />

Here's a description of the repository properties: 

*   **Repository URL** - the URL of the git repository being exported to.
*   **Repository Branch** - the git repository branch (defaults to "master" if none is entered).
*   **Author Name** - the name of the person performing the export. This is a _git commit_ operation.
*   **Author Email Address** - the email of the person performing the export.
*   **Repository Folder** - the folder path, relative to the repository root.

#### Step 2 : Authentication and Export 

The second step of the wizard has two substeps:

<br />
![Image of the Git export substeps](images/DataServiceGitExportSubsteps.png "Git export substeps")
<br />

First, specify authentication properties for access to the git repository. You can either use HTTP or SSH authentication. If you choose to use the the HTTP settings, here is what those input fields look like:

<br />
![Image of the HTTP authentication settings input fields](images/HttpAuthenticationSettings.png "HTTP Authentication Settings")

Here's a description of the HTTP settings: 

*   **User Name** - the user name for the HTTP authentication to the git repository.
*   **Password** - the password for the HTTP authentication to the git repository.

If you are going to use SSH you can use either private key or password authentication. Here is what the SSH settings input fields look like:

<br />
![Image of the SSH authentication settings input fields](images/SshAuthenticationSettings.png "SSH Authentication Settings")

For private key authentication: 

*   **Known Hosts File** - the local file containing the SSH known hosts for either key-based or password authentication.
*   **Private Key File** - the file containing the SSH private key for key-based authentication.
*   **Passphrase** - the SSH passphrase for key-based authentication.

For password authentication: 

*   **Known Hosts File** - the local file containing the SSH known hosts for either key-based or password authentication.
*   **Password** - the SSH password for password-based authentication.

_Note: For more information on how to enter Git repository information, and to persist Git repository information, see the [Git Repository Configurations Preferences](git-settings-help.html) page._

After you have entered the authentication info, click ![Image of the Export button](images/ExportButton.png "Export Button") to perform the export.  
The progress substep will be shown, indicating success or failure.  If the export is successful, you will see a success message similar to this: 
<br />

![Image of export success message](images/DataServiceGitExportSuccess.png "Export success")

If the export fails, you will see a failure message similar to this:
<br />

![Image of export failed message](images/DataServiceGitExportFailed.png "Export Failed").

If an export fails, detail is often provided to help determine the cause of the problem.

When finished with the export, click ![Image of the Finish button](images/FinishButton.png "Finish Button") to go back to the [Data Service Summary](dataservices-summary-help.html) page.

