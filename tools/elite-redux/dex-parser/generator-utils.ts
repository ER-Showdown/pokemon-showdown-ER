import fs from "fs";

export function writeFileData(filepath: string, data: string[]): Promise<void> {
	return new Promise<void>((res, rej) => {
		var file = fs.createWriteStream(filepath);
		file.on("error", (err: string) => {
			console.debug(err);
			rej();
		});
		data.forEach((line) => file.write(`${line}\n`));
		file.on("finish", () => {
			res();
		});
		file.end();
	});
}

export class TypescriptFileGenerator {
	fileData: string[] = [];
	currentIndentation: number = 0;
	filepath: string;

	constructor(filepath: string, fileHeader?: string) {
		this.filepath = filepath;
		if (fileHeader != null) this.fileData.push(fileHeader);
	}

	indent() {
		this.currentIndentation += 4;
	}

	dedent() {
		this.currentIndentation -= 4;
	}

	newObjectDefinition(line: string) {
		this.addLine(`"${line}": {`);
		this.indent();
	}

	addArrayProperty(property: string, value: string[]) {
		const valueArray = value.map((item) => `"${item}"`).join(", ");
		this.addProperty(property, `[${valueArray}]`);
	}

	addStringProperty(property: any, value: string | undefined) {
		if (value == null) return;
		this.addProperty(property, `"${value}"`);
	}

	addObjectProperty(property: any, value: object | undefined) {
		if (value == null) return;
		this.addProperty(
			property,
			JSON.stringify(value, null, 4 + this.currentIndentation)
		);
	}

	addProperty(property: any, value: any) {
		this.addLine(`"${property}": ${value},`);
	}

	endObjectDefinition() {
		this.removeLastComma();
		this.dedent();
		this.addLine("},");
	}

	private removeLastComma() {
		const lastLine = this.fileData[this.fileData.length - 1];

		/// Remove comma from the last definition line we had.
		if (lastLine.endsWith(",")) {
			this.fileData[this.fileData.length - 1] = lastLine.substring(
				0,
				lastLine.length - 1
			);
		}
	}

	private addLine(line: string) {
		this.fileData.push(`${this.indendationString()}${line}`);
	}

	private indendationString(): string {
		let indentation = "";
		let current = 0;
		while (current < this.currentIndentation) {
			indentation += " ";
			current++;
		}

		return indentation;
	}

	save(): Promise<void> {
		this.removeLastComma();
		return writeFileData(this.filepath, this.fileData);
	}
}
