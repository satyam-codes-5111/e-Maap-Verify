import React from 'react';
import { DashboardSidebar, DashboardSidebarProps } from './DashboardSidebar';

export interface SidebarProps extends DashboardSidebarProps {}

export const Sidebar: React.FC<SidebarProps> = (props) => {
  return <DashboardSidebar {...props} />;
};

export default Sidebar;
