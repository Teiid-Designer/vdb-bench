<p style="text-align: center;font-weight: bold;font-size: 22">New Data Source Page</p>

You can configure a new Data Source using any of your currently available Connections.  The Connections are obtained from your teiid instance configuration.  Currently the Data Service Builder will only display the available JDBC connections.

#### Configure Data Source

Select one of the available connections.

![Connections List image](images/DataSourceConnectionsList.png "Connections")

When the connection is selected, the translator dropdown will display.  You can keep the translator selection (if one is selected) or select something different.

![Translators image](images/DataSourceTranslators.png "Translators")

Optionally, you can refine the scope of your source tables by checking **Show Filter Options**.  Filtering is especially helpful for databases which have very large schema, allowing you to limit the tables considered.  If checked, the available schema for the datasource will be shown.  Expand and click the desired schema or catalog.

![Filter Options image](images/DataSourceFilterOptionsOpen.png "Filter Options")

The available tables for the selection will be shown in the tables list.  You can enter a new table filter value if desired.  The '%' wildcard can be used in your filter.  For example, a filter value of 'A%' will yield all tables that start with 'A'.  The table list will update when you change the filter text.

![Filter Option Tables image](images/DataSourceFilterOptionsTables.png "Filter Option Tables")

Finally, enter a name for your data source.  You can also enter a description (optional).

Once you are finished, click ![Save Data Source image](images/SaveButton.png "Save") to save the Data Source. This will take you to the [Data Source Summary](datasource-summary-help.html) page, which will show the new data source along with your other sources.

Of course, you can hit the ![Cancel button](images/CancelButton.png "Cancel Data Source Configuration") button if you no longer wish to configure the data source. Canceling takes you to the [Data Source Summary](datasource-summary-help.html) page.




