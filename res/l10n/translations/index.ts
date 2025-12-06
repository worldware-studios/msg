import { MsgResourceData } from "../../../src/classes/MsgResource/MsgResource";

export default async function(title: string, lang: string) {
  const path = `./${lang}/${title}.json`;
  const data: MsgResourceData = await import(path);
  return data;
}