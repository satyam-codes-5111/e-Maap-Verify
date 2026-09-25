import React from 'react';
import {
  DashboardSidebar,
  DashboardSidebarProps,
  NavItemConfig,
  MasterSidebar,
} from './DashboardSidebar';

export type AdminSidebarProps = DashboardSidebarProps;
export type { NavItemConfig };

export const AdminSidebar: React.FC<AdminSidebarProps> = (props) => {
  return <DashboardSidebar {...props} />;
};

export { MasterSidebar };
export default AdminSidebar;
