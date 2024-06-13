import React, { FC } from "react";
import { useNavigate } from "react-router-dom";

import { id } from ".";
import { MenuButton } from "@/components";
import { Account } from "@/components/icon";

const AccountMenuButton: FC = () => {
  const navigate = useNavigate();
  return (
    <MenuButton
      icon={<Account />}
      onClick={() => navigate(`?appId=${id}`)}
    >
      个人设置
    </MenuButton>
  )
}

export default AccountMenuButton;