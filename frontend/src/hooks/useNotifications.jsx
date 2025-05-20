import NotificationContext from "#contexts/NotificationContext.jsx";
import {useContext} from "react";

const useNotifications = () => useContext(NotificationContext);

export default useNotifications;