import React, { FC, useMemo } from "react";

import { User, FileData } from "@/types";
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
import MoveFileModal from "../MoveFileModal";

import css from "./FilesListContainer.less";

interface FilesListContainerProps {
  user: User;
  filesContext: FilesContextValue;
}

interface HandleParams {
  file: FileData;
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
  const { filesInfo: { loading, files, roleDescription }, viewType, refreshFiles } = filesContext;

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
      delete: ({ file }: HandleParams) => {
        showModal(Modal.Confirmation, ConfirmDeleteModal({
          file,
          user,
          next: () => {
            refresh({ file, type: "delete" });
          }
        }))
      },
      rename: ({ file }: HandleParams) => {
        showModal(RenameFileModal, {
          user,
          file,
          next: (file) => refresh({ file, type: "update" })
        });
      },
      share: ({ file }: HandleParams) => {
        showModal(Modal.Confirmation, ConfirmShareModal({
          file,
          user,
          share: true,
          next: () => {
            refresh({ file, type: "update" });
          }
        }))
      },
      unShare: ({ file }: HandleParams) => {
        showModal(Modal.Confirmation, ConfirmShareModal({
          file,
          user,
          share: false,
          next: () => {
            refresh({ file, type: "update" });
          }
        }))
      },
      touristVisit: ({ file }: HandleParams) => {
        showModal(Modal.Confirmation, ConfirmTouristVisitModal({
          file,
          user,
          touristVisit: true,
          next: () => {
            refresh({ file, type: "update" });
          }
        }))
      },
      unTouristVisit: ({ file }: HandleParams) => {
        showModal(Modal.Confirmation, ConfirmTouristVisitModal({
          file,
          user,
          touristVisit: false,
          next: () => {
            refresh({ file, type: "update" });
          }
        }))
      },
      move: ({ file }: HandleParams) => {
        const previousFile = file;

        showModal(MoveFileModal, {
          user,
          file,
          next: ({ targetFile, file }) => {
            if (!targetFile.extName) {
              refreshNode(`?appId=files&groupId=${targetFile.id}`, { file, type: "create" })
            } else {
              refreshNode(`?appId=files&groupId=${targetFile.groupId}&parentId=${targetFile.id}`, { file, type: "create" })
            };
            refreshNode(spellFileSearch(previousFile), { file, type: "delete" });
            refreshFiles({ file, type: "delete" });
          }
        })
      },
      copy: ({ file }: HandleParams) => {
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
    if (loading) {
      return (
        <div className={css.loading}>
          <LoadingPlaceholder size={64}/>
        </div>
      )
    }
  
    if (!files.length) {
      return (
        <div className={css.empty}></div>
      )
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
