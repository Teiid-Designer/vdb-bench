<p style="text-align: center;font-weight: bold;font-size: 22">New Connection Wizard</p>

Connections can be created and deployed directly to Teiid allowing immediate access to the connection's schemas and data.

The connection wizard will guide you through the process of creating a new connection.

#### General Connection Properties

Select the driver to be used for the connection. The drop-down list displays those drivers already available to Teiid. If the connection requires a custom driver then this can be deployed using the slide-in page opened by clicking the 'New Driver' button.

Enter a name for the connection. This is validated for uniqueness.

The JNDI identifier for the connection is auto-generated from the connection name. It can be manually modified if preferred. Also, validated for uniqueness.

On completion, click 'Next' to proceed to the next page.

#### Specific Connection Properties

This page allows entering values for properties specific to the type of driver selected.
*  Some properties are completely optional and can be left blank;
*  Some properties are required and must have values applied to them;
*  Some properties are provided with default values by the underlying driver. These can be modified if preferred.

On completion, click 'Next' to proceed to the next page.

#### Create the Connection

The page will display the status of both the creation of the connection in the workspace and its subsequent deployment to Teiid. Should an error occur in either operation then this will be displayed accordingly.

Clicking the ![Cancel button](images/CancelButton.png "Cancel New Connection") button prior to the creation of the connection will abort the wizard and return to the [Connection Summary](connections-summary-help.html) page, without anything being create either in the workspace or deployed to Teiid. Once the connection is in the process of being created then clicking the button should be avoided until all operations have completed.
