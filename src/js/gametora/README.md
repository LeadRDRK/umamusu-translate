# GameTora data import tools
These files are used for converting data from GameTora to a format usable by umamusu-translate (and UmaPatcher)

- Run `npm install` to install the dependencies.
- Run `download.sh` to download the data from GameTora. Alternatively, download the files listed in the script manually and put them in a `data` folder.
- Run `gen-data.js <path to master.mdb>` to generate additional data from the master.mdb file.
- Run `gen.js` to generate the output files, which will be written to `out` folder.
