### <p style="text-align: center">![Test icon](images/TestIcon.png "Test Data Service") Test Data Service Page</p>

Once a dataservice has been created in the workspace, it is available to be deployed for testing. This involves:

* exporting the dataservice from the workspace;
* deployment of the exported dataservice to the teiid instance;
* executing the dataservice on the running teiid instance.

On successful deployment, the testing page is available for executing data queries through the dataservice. Queries can be crafted using two forms.

#### OData
[OData](https://www.odata.org) is a standard for providing metadata for the querying of restful interfaces. Teiid provides such a restful interface to its services on deployment. Therefore, the crafting of a specific URL, which includes the quering metadata, is enough to enact the query and return the appropriate results.

Since the OData URL can quickly become complex, a set of widgets is provided to help create it.

* **Select** - This provides a selection list of all the models available in the dataservice. Only one model can be queried at a time and the first model is populated by default.
  * **Limit** - The limit dropdown provides options for arbitrarily filtering the number of results returned by the query, with the exception of 'count only' option which returns a value representing the number of results rather than the collection of results.
* **Columns** - This provides a list of the available columns with checkboxes, allowing selection of which columns the query should return.
* **Where** - This provides a widget for generating where clauses that filter the query results based on inputted criteria. Addition of extra clauses can be performed using the '+' button (clauses are appended using the "AND" keyword to further filter results).
* **Order By** - This orders the results either ascending or descending using the selected column.

Once the URL has been generated, the 'Submit' button can be clicked and the results table should be displayed containing those results that conform to the query parameters. By default, the 'Tabular' tab is selected, displaying the results in a tabular format. However, a second 'Raw' tab is available that displays the results in their raw json-formatted text.

#### SQL
An alternative search tool that provides a text editor for entering a teiid-compatible SQL query directly. Once entered, the query can be submitted and the results table will displayed accordingly. The number of records can be limited using the 'Record Limit' and can be used in combination with 'Starting Record Index' to return a subset of those results that the query returns.
