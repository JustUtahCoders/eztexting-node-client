let readStdinResolve;

export async function readStdin() {
  process.stdin.on("readable", readInput);
  return new Promise((resolve) => {
    readStdinResolve = resolve;
  });
}

function readInput() {
  let str = "";
  let chunk;
  // Use a loop to make sure we read all available data.
  while ((chunk = process.stdin.read()) !== null) {
    str += chunk;
  }

  process.stdin.off("readable", readInput);

  if (typeof readStdinResolve === "function") {
    readStdinResolve(str);
  }
}
