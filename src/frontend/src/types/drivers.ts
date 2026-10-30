export interface DriverValues { nombre_completo:string; dni:string; licencia_categoria:string; anios_experiencia:number; telefono:string; estado:'ACTIVO'|'INACTIVO' }
export interface DriverAccount { usuario_id: string; email: string; estado: string }
export interface Driver extends DriverValues { conductor_id:string; cuenta_vinculada?: boolean; cuenta?: DriverAccount | null }
export interface DriverAccountPage { items: DriverAccount[]; total: number; page: number; pageSize: number }
export interface DriverPage {items:Driver[];total:number;page:number;pageSize:number}
