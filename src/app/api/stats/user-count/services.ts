import { countUsers } from "./repository";

export async function getUserCountService() {
  return { count: await countUsers() };
}
