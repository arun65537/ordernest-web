import axios from "axios";
import { gatewayBaseUrl } from "./gatewayBaseUrl";

const authApi = axios.create({
  baseURL: gatewayBaseUrl
});

export default authApi;

