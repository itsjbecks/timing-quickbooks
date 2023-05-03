import * as fs from "fs";
import * as path from "path";
import CsvReader from "csv-reader";

const importFile = async (
  uri: string,
  callback?: (row: any) => Promise<any> | any
) =>
  new Promise((resolve) => {
    const fileUrl = path.resolve(__dirname, uri);
    const stream = fs
      .createReadStream(fileUrl, "utf8")
      .pipe(
        new CsvReader({
          skipEmptyLines: true,
          asObject: true,
          parseNumbers: true,
        })
      )
      .on("data", async (row: any) => {
        stream.pause();
        await callback?.(row);
        stream.resume();
      })
      .on("error", (err) => console.log(err))
      .on("end", () => resolve("Import Complete"));
  });

type Row = {
  Project: string;
  Day: string;
  Duration: number;
  Notes: string;
};

const main = async () => {
  try {
    const FILE = "./data/wx-april.csv";

    const rows: Row[] = [];
    await importFile(FILE, (row) => rows.push(row));

    // group rows by project and then sub group by day. Sum the duration of each day and combine the notes for each day
    const projectsByDay = rows.reduce((acc, row) => {
      // if (row.Project !== "Pelicargo") return acc;

      const { Project, Day, Duration, Notes } = row;
      if (!acc[Project]) {
        acc[Project] = {
          name: Project,
          sum: 0,
          days: {},
        };
      }
      if (!acc[Project].days[Day]) {
        acc[Project].days[Day] = {
          seconds: Duration,
          notes: Notes,
        };
        acc[Project].sum += Duration;
      } else {
        acc[Project].days[Day].seconds += Duration;
        acc[Project].days[Day].notes += `\n${Notes}`;
        acc[Project].sum += Duration;
      }
      return acc;
    }, {} as any);

    Object.entries(projectsByDay).forEach(([, { name, sum, days }]: any) => {
      const sumHrs = sum / 3600;
      const roundedSum = Math.round(sumHrs * 100) / 100;

      console.log(
        `\n\n\n\n\n⬇️============ ${name} - ${roundedSum} ============⬇️\n`
      );

      Object.entries(days).forEach(([day, { seconds, notes }]: any) => {
        const hours = seconds / 60 / 60;
        const roundedHours = Math.round(hours * 100) / 100;

        console.log(day);
        console.log(notes);
        console.log(roundedHours);
        console.log("-----\n");
      });

      console.log(
        `⬆️============ ${name} - ${roundedSum} ============⬆️\n\n\n\n\n`
      );
    });
  } catch (error) {
    console.error(error);
  }
};

main()
  .then(() => console.log("Done"))
  .finally(() => process.exit(0));
