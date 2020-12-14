## CSV to Array for Javascript/browsers

`csv-to-array-browser` module works for browsers. You can use it in any of your frontend projects.

#### How to Install

```
npm i csv-to-array-browser
```

#### Example Usage

```
// import the package into your project
import CSVToArray  from 'csv-to-array-browser';

// get the csv file
const file = event.target.files[0]

// convert the csv file into JavaScript array
const convertedData = await CSVToArray(file)
```

#### delimiter (optional)

```
CSVToArray takes two paramaters: file and delimiter (optional). The default delimiter is ','.

// delimeter is $
const convertedData = await CSVToArray(file, '$')
```
