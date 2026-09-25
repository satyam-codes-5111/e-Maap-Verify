import React from 'react';
import { DashboardSidebar, DashboardSidebarProps } from '../DashboardSidebar';

export interface ApplicantSidebarProps extends DashboardSidebarProps {}

export const ApplicantSidebar: React.FC<ApplicantSidebarProps> = (props) => {
  return <DashboardSidebar role="BUSINESS_USER" {...props} />;
};

export default ApplicantSidebar;
