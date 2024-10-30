# Data Obfuscation Tool

This project, `data-obfuscation-tool`, provides a solution for obfuscating sensitive data within databases. It is designed to ensure the privacy and security of data by applying customizable obfuscation techniques.

## Getting Started

### Prerequisites

Before you begin, ensure you have the following:

- Node.js installed on your machine.
- Access to a RDBMS i.e MySQL database.
- The YAML configuration file set up for the database and tool settings.

### Installation

To get started with the `data-obfuscation-tool`, follow these steps:

```
git clone https://github.com/QbDVision-Inc/data-obfuscation-tool.git
cd data-obfuscation-tool
npm install
```
### Configuration

1. **Create a Configuration File**:  
   Copy `config-template.yaml` to `config.yaml` in the root directory.
    ```shell
    cp config-template.yaml config.yaml
    ```

   Here's an example format:

    ```yaml
    database:
      host: localhost
      username: root
      password: yourpassword
      database: yourdatabase
      dialect: mysql
      logging: false
 
    inputDump: <Path to input dump>/database_dump.sql
    outputDump: <Path to output dump>/obfuscated_dump.sql
    ```

   Update this file with your database details, the name of the dump file, and the path for the obfuscated output.

2. **Define Obfuscation Rules**:

   Copy `obfuscationCfg-template.yaml` to `obfuscationCfg.yaml` in the root directory.
    ```shell
    cp obfuscationCfg-template.yaml obfuscationCfg.yaml
    ```
    The `obfuscationCfg.yaml` file is central to defining how data in your database should be obfuscated. This configuration file allows you to specify rules for general data types, specific columns, and even entire tables.

   #### Structure of `obfuscationCfg.yaml`
   The configuration file is divided into three main sections: `general`, `columns` and `tables`.

   #### 1. General Rules
   - `type`: Specifies the data type for which the rule applies (e.g., `string`).
   - `obfuscationRule`: The name of the obfuscation function to be used for this data type.
       - Currently supported obfuscation rules are
       - `stringObfuscator`: Mask the value with `X` except for the first character. Can't de-obfuscate to original value, but somebody who knows the original might be able to guess it.
           - `Biopharma pilot` becomes `BXXXXXXXX p****`
       - `xorObfuscator`: Apply a bitwise XOR operation with a random key to each character. The same key must be used to de-obfuscate.
           - `Biopharma pilot` becomes `Id3ld4dasd aqwod` (relatively random text)
       - `dictionaryObfuscator`: Replace the value with a random value from a dictionary. Can't de-obfuscate to original value.
           - `Biopharma pilot` becomes `Whimsical across` (or some other random 9 character word)
       - `noObfuscator`: Replace the value with itself.
           - `Biopharma pilot` becomes `Biopharam pilot` (no change)
   - `ignorePattern`: A regular expression pattern to match values that should not be obfuscated.

       Example:

       ```yaml
       general:
         - type: "string"
           obfuscationRule: "stringObfuscate"
           ignorePattern: >
             (^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$)
             |(^\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b$)
             |(^\[?\s*\{.*?\}\s*(,\s*\{.*?\}\s*)*\]?$)

   #### 2. Column-Specific Rules
   
     - `name`: The name of the column.
     - `ignore`: Set to `true|false` to exclude|include this column from obfuscation, default is false.

       Example:

         ```yaml
       columns:
           - name: currentState
             ignore: true
           - name: objectModel
             ignore: true
           - name: fromLibraryModel
             ignore: true

   #### 3. Table-Specific Rules
    
     - `name`: The name of the table.
     - `ignore`: Set to true to exclude the entire table from obfuscation.
     - `columns`: An array of column-specific rules within the table.

       Example:

         ```yaml
          tables:
            - name: SequelizeMeta
              ignore: true
            - name: Projects
              columns:
                - name: "name"
                  obfuscationRule: "stringObfuscator"
                  ignorePattern: null
            - name: UserActivities
              columns:
                - name: "requestContext"
                  obfuscationRule: "requestContextObfuscator"
                  ignorePattern: null

   
     - This configuration file allows for fine-grained control over how different data types, columns and tables are handled.
     - Note that each rule must have its implementation in the [ObfuscatorStrategyMap](src%2Fclasses%2Fobfuscators%2FObfuscatorStrategyMap.js), The function name must be matching the rule name.


3. **Running the Tool**:
   ```
   node src/index.js
   ```
   The script will run and obfuscate the data as per the configurations and rules you have defined.

### MySQL Configuration

If you are using MySQL, you may need to update your `my.cnf`/`my.ini` file to allow for larger packet sizes. This is necessary when importing large tables of data.
```
[mysqld]
max_allowed_packet=512M
```

### Contributing
Contributions to data-obfuscation-tool are welcome. Please feel free to fork the repository and submit pull requests.

### License
This project is licensed under the MIT License.
