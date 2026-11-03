import { redirect } from "next/navigation";
import {Localized} from './admin-locale';
import { chatGPTSignInPath, chatGPTSignOutPath, getChatGPTUser } from "../chatgpt-auth";
import { findAdminActor } from "../access-policy";
import AdminConsole from "./admin-console";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const authenticated = await getChatGPTUser();
  if (!authenticated) redirect(chatGPTSignInPath("/admin"));
  const actor = await findAdminActor(authenticated.email);
  if (!actor) return <Localized as="main" className="access-denied"><Localized as="h1">Для этой почты нет доступа</Localized><Localized as="p">Попросите владельца платформы добавить вас в школу и указать именно эту электронную почту.</Localized><Localized as="a" href={chatGPTSignOutPath("/admin")}>Выйти и войти с другой почтой</Localized><Localized as="a" href="/">Вернуться на портал</Localized></Localized>;
  const user = authenticated;
  return <AdminConsole user={{ name: actor.fullName || user.displayName, email: user.email, role: actor.role, schoolId: actor.schoolId, permissions: actor.permissions, isOwner: actor.isOwner }} signOutHref={chatGPTSignOutPath("/admin")} />;
}
