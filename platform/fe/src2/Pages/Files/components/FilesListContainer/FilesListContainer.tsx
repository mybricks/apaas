import React, { FC, useMemo } from "react";
import axios from "axios";
import { message } from "antd";

import { User, FileData, InstalledApp } from "@/types";
import ViewAsTable from "./ViewAsTable";
import ViewAsGrid from "./ViewAsGrid";
import { useFilesMenuTreeContext, useModalConetxt } from "@/context";
import { Modal } from "@/components";
import { FilesContextValue } from "../../FilesProvider";
import { spellFileSearch } from "@/utils/file";
import RenameFileModal from "../RenameFileModal";
import ConfirmDeleteModal from "../ConfirmDeleteModal";
import ConfirmShareModal from "../ConfirmShareModal";
import ConfirmTouristVisitModal from "../ConfirmTouristVisitModal";
import CopyFileModal from "../CopyFileModal";

interface FilesListContainerProps {
  user: User;
  filesContext: FilesContextValue;
}

interface HandleParams {
  file: FileData;
  app: InstalledApp;
}

export type Handle = {
  [key in 
    "delete" |
    "rename" |
    "share"
  ]: (params: HandleParams) => void;
}

const FilesListContainer: FC<FilesListContainerProps> = ({
  user,
  filesContext,
}) => {
  const { refreshNode } = useFilesMenuTreeContext();
  const { showModal } = useModalConetxt();
  const { loading, filesInfo: { files, roleDescription }, viewType, refreshFilesInfo } = filesContext;

  const handle: Handle = useMemo(() => {
    const refresh = ({ file, type }: { file: FileData, type: "delete" | "create" | "update"}) => {
      refreshFilesInfo({ file, type }) ;

      if (file.extName === "folder") {
        refreshNode(spellFileSearch(file), {
          file,
          type
        });
      }
    }
    return {
      delete: ({ file, app }: HandleParams) => {
        showModal(Modal.Confirmation, ConfirmDeleteModal({
          file,
          user,
          next: () => {
            refresh({ file, type: "delete" });
          }
        }))
      },
      rename: ({ file, app }: HandleParams) => {
        showModal(RenameFileModal, {
          user,
          file,
          next: (file) => refresh({ file, type: "update" })
        });
      },
      share: ({ file, app }: HandleParams) => {
        showModal(Modal.Confirmation, ConfirmShareModal({
          file,
          user,
          share: true,
          next: () => {
            refresh({ file, type: "update" });
          }
        }))
      },
      unShare: ({ file, app }: HandleParams) => {
        showModal(Modal.Confirmation, ConfirmShareModal({
          file,
          user,
          share: false,
          next: () => {
            refresh({ file, type: "update" });
          }
        }))
      },
      touristVisit: ({ file, app }: HandleParams) => {
        showModal(Modal.Confirmation, ConfirmTouristVisitModal({
          file,
          user,
          touristVisit: true,
          next: () => {
            refresh({ file, type: "update" });
          }
        }))
      },
      unTouristVisit: ({ file, app }: HandleParams) => {
        showModal(Modal.Confirmation, ConfirmTouristVisitModal({
          file,
          user,
          touristVisit: false,
          next: () => {
            refresh({ file, type: "update" });
          }
        }))
      },
      // move 文件移动，TODO
      copy: ({ file, app }: HandleParams) => {
        showModal(CopyFileModal, {
          user,
          file,
          next: (file) => {
            refresh({ file, type: "create" });
          }
        })
      },
    }
  }, []);

  if (viewType === "grid") {
    return (
      <ViewAsGrid
        user={user}
        files={files}
        handle={handle}
        roleDescription={roleDescription}
      />
    )
  }
  return (
    <ViewAsTable
      user={user}
      files={files}
      loading={loading}
      handle={handle}
      roleDescription={roleDescription}
    />
  )
}

const handleDelete = ({ file, user }: { file: FileData, user: User}) => {

}

export default FilesListContainer;
