var vdbBench = (function(vdbBench) {

	vdbBench.VdbController = vdbBench._module.controller('vdbBench.VdbController',
			[
			 	'$scope',
			 	function($scope) {
			 		$scope.expandableEx = '' +
			        '<div class="expandable closed">\n' +
			        '   <div title="The title" class="title">\n' +
			        '     <i class="expandable-indicator"></i> Expandable title\n' +
			        '   </div>\n' +
			        '   <div class="expandable-body well">\n' +
			        '     This is the expandable content...  Note that adding the "well" class isn\'t necessary but makes for a nice inset look\n' +
			        '   </div>\n' +
			        '</div>';

			 		$scope.vdbs = [
			 		        {name : 'portfolio', data : portfolioXml.join("")},
			 		        {name : 'tweet', data : ""}
			 		];
			 	}
			 ]);
	return vdbBench;

})(vdbBench || {});

var portfolioXml = [];
	portfolioXml.push(
		"<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"yes\"?>",
		"<vdb name=\"Portfolio\" version=\"1\">",
		"<description>The Portfolio Dynamic VDB</description>",
		"<property name=\"UseConnectorMetadata\" value=\"true\" />",
		"<model name=\"MarketData\">",
		"<source name=\"text-connector\" translator-name=\"file\" connection-jndi-name=\"java:/marketdata-file\"/>",
		"</model>",
		"<model name=\"Accounts\">",
		"<property name=\"importer.useFullSchemaName\" value=\"false\"/>",
		"<source name=\"h2-connector\" translator-name=\"h2\" connection-jndi-name=\"java:/accounts-ds\"/>",
		"</model>",
		"<model name=\"PersonalValuations\">",
		"<property name=\"importer.headerRowNumber\" value=\"1\"/>",
		"<property name=\"importer.ExcelFileName\" value=\"otherholdings.xls\"/>",
		"<source name=\"excelconnector\" translator-name=\"excel\"  connection-jndi-name=\"java:/excel-file\"/>",
		"<metadata type=\"DDL\">","<![CDATA[",
		"SET NAMESPACE \'http://www.teiid.org/translator/excel/2014\' AS teiid_excel;",
		"CREATE FOREIGN TABLE Sheet1 (",
		"ROW_ID integer OPTIONS (SEARCHABLE \'All_Except_Like\', \"teiid_excel:CELL_NUMBER\" \'ROW_ID\'),",
		"ACCOUNT_ID integer OPTIONS (SEARCHABLE \'Unsearchable\', \"teiid_excel:CELL_NUMBER\" \'1\'),",
		"PRODUCT_TYPE string OPTIONS (SEARCHABLE \'Unsearchable\', \"teiid_excel:CELL_NUMBER\" \'2\'),",
		"PRODUCT_VALUE string OPTIONS (SEARCHABLE \'Unsearchable\', \"teiid_excel:CELL_NUMBER\" \'3\'),",
		"CONSTRAINT PK0 PRIMARY KEY(ROW_ID)",
		") OPTIONS (\"teiid_excel:FILE\" \'otherholdings.xls\', \"teiid_excel:FIRST_DATA_ROW_NUMBER\" \'2\');",
		"]]>\", \"</metadata>\",",
		"</model>",
		"<model name=\"Stocks\" type=\"VIRTUAL\">",
		"<metadata type=\"DDL\">","<![CDATA[",
		"CREATE VIEW StockPrices (",
        "symbol string,",
        "price bigdecimal",
        ")",
        "AS", 
        "SELECT SP.symbol, SP.price",
        "FROM (EXEC MarketData.getTextFiles(\'*.txt\')) AS f,",
        "TEXTTABLE(f.file COLUMNS symbol string, price bigdecimal HEADER) AS SP;",
        "CREATE VIEW Stock (",
        "product_id integer,",
        "symbol string,",
        "price bigdecimal,",
        "company_name   varchar(256)",
        ")",
        "AS",
        "SELECT  A.ID, S.symbol, S.price, A.COMPANY_NAME",
        "FROM StockPrices AS S, Accounts.PRODUCT AS A",
        "WHERE S.symbol = A.SYMBOL;",
        "]]>", "</metadata>",
        "</model>",
        "<model name=\"StocksMatModel\" type=\"VIRTUAL\">",
        "<metadata type=\"DDL\">","<![CDATA[",
        "CREATE view stockPricesMatView",
        "(",
        "product_id integer,",
        "symbol string,",
        "price bigdecimal,",
        "company_name   varchar(256)",
        ")",
        "AS SELECT  A.ID, S.symbol, S.price, A.COMPANY_NAME",
        "FROM Stocks.StockPrices AS S, Accounts.PRODUCT AS A",
        "WHERE S.symbol = A.SYMBOL;",
        "]]>",
        "</metadata>",
        "</model>",  
        "</vdb>");