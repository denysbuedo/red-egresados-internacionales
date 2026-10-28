import "server-only";
import {sqlite} from "@/db";
import {hashPassword,verifyPassword} from "./auth";
import {createPasswordRecovery} from "./password-recovery.cjs";
import {notificationEngine} from "./notification-suite";
export const passwordRecovery=createPasswordRecovery(sqlite,{hashPassword,verifyPassword,engine:notificationEngine});
