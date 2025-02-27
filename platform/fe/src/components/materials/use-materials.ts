import { useState, useCallback, useRef } from 'react';
import { message } from 'antd'
import {
  getMaterials,
  deleteMaterial,
  importMaterials,
  shareMaterial,
  pullMaterial,
  getMaterialVersions,
  getRemoteLatestVersionByNamespaces
} from './services';

interface Material {
  id: string;
  [key: string]: any;
}

interface MaterialsResponse {
  list: Material[];
  total: number;
}

interface UseMarketMaterialsOptions {
  pageSize?: number;
  /** 请求时是否获取最新组件库版本 */
  shouldFetchLatestVersion?: boolean
  onSuccess?: () => void;
  onError?: () => void;
}

export function useMarketMaterials(options: UseMarketMaterialsOptions = {}) {
  const { pageSize = 50, shouldFetchLatestVersion } = options;
  
  const [loading, setLoading] = useState(false);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const remoteMaterialsMap = useRef({})

  // 使用 useRef 存储查询参数
  const queryRef = useRef<Record<string, any>>({});

  // 获取物料列表
  const fetchMaterials = useCallback(async (params: any = {}, reset: boolean = true) => {
    setLoading(true);
    try {
      // 如果是重置，则清空现有数据
      if (reset) {
        setMaterials([]);
        setCurrentPage(1);
        queryRef.current = params;
      }

      const requestParams = {
        ...(queryRef.current ?? {}),
        page: reset ? 1 : currentPage,
        pageSize,
        ...params,
      };

      const response = await getMaterials<MaterialsResponse>(requestParams);
      const newMaterials = response.list ?? []
      
      // 如果需要获取组件最新版本的话
      if (shouldFetchLatestVersion) {
        const remoteMaterialsNamespaces = newMaterials.filter((material, index) => {
          if (material.scope_status === 3) {
            remoteMaterialsMap.current[material.namespace] = index;
            return true;
          }
          return false;
        }).map((material) => {
          return material.namespace;
        });

        if (Array.isArray(remoteMaterialsNamespaces) && remoteMaterialsNamespaces.length) {
          const latestRemoteMaterials: any = await getRemoteLatestVersionByNamespaces({ namespaces: remoteMaterialsNamespaces });

          latestRemoteMaterials.forEach((latestRemoteMaterial) => {
            const { namespace, version } = latestRemoteMaterial;

            const material = newMaterials[remoteMaterialsMap.current[namespace]];

            if (material.version !== version) {
              material.nextVersion = version;
            }
          });
        }
      }
      
      setMaterials(prev => reset ? newMaterials : [...prev, ...newMaterials]);
      setTotal(response.total);
      setHasMore(newMaterials.length === pageSize);
      

      if (!reset) {
        setCurrentPage(prev => {
          return prev + 1
        });
      }
      
      return response;
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, shouldFetchLatestVersion]);

  // 加载更多
  const loadMore = useCallback(async () => {
    if (!hasMore || loading) return;
    await fetchMaterials({ page: currentPage + 1 }, false);
  }, [fetchMaterials, hasMore, loading, currentPage]);

  // 重置并重新加载
  const refresh = useCallback((params = {}) => {
    return fetchMaterials({ ...(queryRef.current ?? {}), ...params }, true);
  }, [fetchMaterials]);

  // 删除物料
  const removeMaterial = useCallback(async (material: any, user) => {
    await deleteMaterial({ id: material.id, userId: user?.id }, async () => {
  		message.success('删除成功');
  		// 删除成功后刷新列表
      await refresh();
  	}, () => {
  		message.error('删除失败，请重试');
  	});
  }, [refresh, options]);

  // 升级物料
  const upgradeMaterialItem = useCallback(async (material: any, user) => {
    const { namespace } = material
    message.loading({ content: `升级${material.version}到${material.nextVersion}...`, key: namespace, duration: 0 });
    await pullMaterial(
      { namespaces: [namespace], userId: user?.id },
      () => {
        const isBetaVersion = (material.nextVersion ?? '').includes('-beta');

        message.success({
          content: isBetaVersion
            ? `升级测试版本 ${material.nextVersion} 成功`
            : `升级主版本 ${material.nextVersion} 成功`,
          key: namespace,
        });

        setMaterials(prevMaterials => {
          const targetMaterial = prevMaterials.find(m => m.namespace === namespace);
          /** 测试版本不更新列表中数据版本号 */
          targetMaterial.version =
            (isBetaVersion ? '' : material.nextVersion) || material.version;
          targetMaterial.nextVersion = null;
          return [...prevMaterials]
        })
      },
      () => {
        message.destroy(namespace);
      },
    );
  }, [refresh, options]);

  return {
    loading,
    materials,
    total,
    hasMore,
    fetchMaterials,
    loadMore,
    refresh,
    removeMaterial,
    upgradeMaterialItem,
  };
}

export type MarketMaterialValue = ReturnType<typeof useMarketMaterials>;


interface UseSelectableMaterialsOptions {
  pageSize?: number;
  /** 是否请求的是中心化服务 */
  isQueryRemote?: boolean
}

export const useSelectableMaterials = (options: UseSelectableMaterialsOptions) => {
  const { pageSize = 50, isQueryRemote } = options ?? {};

  const [loading, setLoading] = useState(false);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  // 使用 useRef 存储查询参数
  const queryRef = useRef<Record<string, any>>({});

  // 获取物料列表
  const fetchMaterials = useCallback(async (params: any = {}, reset: boolean = true) => {
    setLoading(true);
    try {
      // 如果是重置，则清空现有数据
      if (reset) {
        setMaterials([]);
        setCurrentPage(1);
        queryRef.current = params
      }

      const requestParams = {
        ...(queryRef.current ?? {}),
        page: reset ? 1 : currentPage,
        pageSize,
        ...params,
      };

      const response = await getMaterials<MaterialsResponse>(requestParams, isQueryRemote);
      const newMaterials = response.list ?? []
      
      setMaterials(prev => reset ? newMaterials : [...prev, ...newMaterials]);
      setTotal(response.total);
      setHasMore(newMaterials.length === pageSize);
      

      if (!reset) {
        setCurrentPage(prev => {
          return prev + 1
        });
      }
      
      return response;
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize]);

  // 加载更多
  const loadMore = useCallback(async () => {
    if (!hasMore || loading) return;
    await fetchMaterials({ page: currentPage + 1 }, false);
  }, [fetchMaterials, hasMore, loading, currentPage]);

  return {
    loading,
    materials,
    total,
    hasMore,
    fetchMaterials,
    loadMore,
  }
}

export type SelectableMaterialValue = ReturnType<typeof useSelectableMaterials>;