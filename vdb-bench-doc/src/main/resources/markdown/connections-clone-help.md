### <p style="text-align: center">Copy Connection Page</p>

This page is used to create a new connection from an existing one. The name of the connection being copied appears in the page title. For instance, the page title would say **Copy Connection 'ExampleDS'** if the **ExampleDS** connection is being copied to create the new connection.

Once you enter the name of the new connection, click the ![Create](images/CreateButton.png "Create Connection") button to create the new connection. The new connection is added to the workspace and deployed to Teiid. In order to correctly deploy a second distinct connection to teiid, the jndi name property of the connection is also updated.

On completion, a status message will be displayed. This will indicate the success of the operations. Should everything have proceeded correctly then the page will refresh to the [Connection Summary page](connections-summary-help.html).

Should the operation have failed for any reason, no refresh will take place to allow for reading of any error messages. Pressing the cancel button will return to the [Connection Summary page](connections-summary-help.html).

Whether the operation was successful or not, the Create button can only be pressed once. The [Connection Summary page](connections-summary-help.html) should be returned to prior to any further copy operation.
