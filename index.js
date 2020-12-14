export default async (value, delimiter) => {
  if (value) {
    const reader = new FileReader();
    const textValue = await new Promise((resolve, reject) => {
      reader.onload = (event) => resolve(event.target.result); // desired file content
      reader.onerror = (error) => reject(error);
      reader.readAsText(value);
    });
    return csvJSON(textValue, delimiter);
  }
};

const csvJSON = (csv, delimiter = ',') => {
  var lines = csv.split('\n');

  const result = [];

  const headers = lines[0]
    .split(delimiter)
    .map((item) => item.replace(/(^"|"$)/g, ''));

  for (let i = 1; i < lines.length; i++) {
    const obj = {};
    const currentline = lines[i]
      .split(delimiter)
      .map((item) => item.replace(/(^"|"$)/g, ''));

    for (let j = 0; j < headers.length; j++) {
      obj[headers[j].trim().toLowerCase()] = currentline[j].trim();
    }

    result.push(obj);
  }

  return result;
};
