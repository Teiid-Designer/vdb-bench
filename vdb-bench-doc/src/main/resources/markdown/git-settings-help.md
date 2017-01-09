### <p style="text-align: center">Git Repository Configuration Page</p>

This page can be used to create git repository configurations to use during data service import.

You can either add a new configuration or select a saved repository for edit. To choose a saved repository select one from this dropdown list:

<br />

![Image of the saved Git repositories dropdown](images/SavedGitRepositoriesDropdown.png "Saved Git Repositories list")

<br />

Once a saved repository is selected, its properties are used to populate the fields in the form. If you want to modify a property of a saved repository, you can enter or change properties in the input fields and click the Save button to persist your changes. When adding a new configuration, enter the appropriate values and click Save. 

<br />

![Image of the Git repository properties input fields](images/GitRepositoryProperties_preferences.png "Git Repository Properties")

<br />

Here's a description of those import repository properties: 

*   **Repository URL** - the URL of the git repository being imported from.
*   **Repository Branch** - the git repository branch (defaults to "master" if none is entered).
*   **Author Name** - Not required for imports, only exports. This is the github user name of the person that wrote the data service, which may or may not be the same as the committer name.
*   **Author Email Address** - not required for imports, only exports. This is the same the github user email of the person that wrote the data service, which may or may not be the same as the committer. 

To persist these changes, the Save button must be clicked.



