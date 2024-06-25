import React, { FC, useMemo } from "react";

import { User, FileData, InstalledApp } from "@/types";
import ViewAsTable from "./ViewAsTable";
import ViewAsGrid from "./ViewAsGrid";
import { useFilesMenuTreeContext, useModalConetxt } from "@/context";
import { Modal, LoadingPlaceholder } from "@/components";
import { FilesContextValue } from "../../FilesProvider";
import { spellFileSearch } from "@/utils/file";
import RenameFileModal from "../RenameFileModal";
import ConfirmDeleteModal from "../ConfirmDeleteModal";
import ConfirmShareModal from "../ConfirmShareModal";
import ConfirmTouristVisitModal from "../ConfirmTouristVisitModal";
import CopyFileModal from "../CopyFileModal";

import css from "./FilesListContainer.less";

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
  const { loading, filesInfo: { files, roleDescription }, viewType, refreshFiles } = filesContext;

  const handle: Handle = useMemo(() => {
    const refresh = ({ file, type }: { file: FileData, type: "delete" | "create" | "update"}) => {
      refreshFiles({ file, type }) ;

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
    if (filesContext.loading) {
      return (
        <div className={css.loading}>
          <LoadingPlaceholder size={64}/>
        </div>
      )
    }
  
    if (!filesContext.filesInfo.files.length) {
      return "暂无内容，请添加...";
    }

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

export default FilesListContainer;
