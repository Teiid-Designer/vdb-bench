<p style="text-align: center;font-weight: bold;font-size: 22">Edit Data Source Page</p>

You can edit an existing Data Source - the current data source selections will be shown.

The data source wizard will guide you through the process of editing the data source. 

#### Choose Connection

The data source name cannot be changed, but you can enter or change the description (optional).

You can select a different connection if desired.

![Connections List image](images/DataSourceConnectionsList.png "Connections")

Keep the selected translator or select something different.

![Translators image](images/DataSourceTranslators.png "Translators")

Optionally, you can limit the tables for your Data Source by checking **Filter Connection**.  Filtering is especially helpful for databases which have very large schema.  If checked, an additional wizard step is shown - click 'Next' to proceed to the filter page.

![Filter Options image](images/DataSourceFilterConnection.png "Filter Connection")

#### Define Filtering

Expand and click on the desired catalog or schema node in the display to see the schema tables.
 
![Filter Option Schema image](images/DataSourceFilterOptionsOpen.png "Filter Option Schema")

The available tables for the selection will be shown in the tables list.  You can enter a new table filter value if desired.  The '%' wildcard can be used in your filter.  For example, a filter value of 'A%' will yield all tables that start with 'A'.  The table list will update when you change the filter text.

![Filter Option Tables image](images/DataSourceFilterOptionsTables.png "Filter Option Tables")

Once you are finished, click ![Update Data Source image](images/FinishButton.png "Finish") to update your data source. This will take you to the [Data Source Summary](datasource-summary-help.html) page, which will show the updated data source along with your other sources.

Of course, you can hit the ![Cancel button](images/CancelButton.png "Cancel Edit Data Source") button if you no longer wish to edit the data source. Canceling takes you to the [Data Source Summary](datasource-summary-help.html) page.




