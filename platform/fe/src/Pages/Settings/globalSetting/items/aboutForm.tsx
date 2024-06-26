import React, {
  useState,
  useCallback,
  useEffect
} from 'react'
import compareVersion from 'compare-version'
import axios from 'axios'
import {QuestionCircleOutlined, InboxOutlined, GlobalOutlined, ThunderboltOutlined, MessageOutlined, EnterOutlined, LoadingOutlined } from '@ant-design/icons'
import {
  Button,
  message,
  Popover,
  Upload,
  Input,
  Tabs,
} from 'antd'
import { useAppConetxt, useUserContext } from '@/context'
import styles from '../index.less'

const APaaS = (
  <svg t="1692783854334" class="icon" viewBox="0 0 4352 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="3776" width="120"><path d="M581.083429 1008.64c0-12.434286-0.219429-24.868571-0.658286-37.302857a1140.333714 1140.333714 0 0 1-0.658286-37.924572 259.730286 259.730286 0 0 1-71.314286 46.957715c-24.466286 10.24-46.957714 17.993143-67.510857 23.149714a345.417143 345.417143 0 0 1-71.387428 10.24c-42.825143 0-84.187429-6.582857-124.050286-19.894857a310.162286 310.162286 0 0 1-105.435429-58.514286c-30.866286-26.148571-55.954286-58.697143-75.227428-97.718857-18.834286-39.424-29.330286-85.065143-31.451429-136.923429 0-52.297143 7.021714-99.84 21.211429-142.701714 14.116571-43.300571 35.328-80.347429 63.634286-111.213714 28.269714-30.866286 63.414857-54.637714 105.398857-71.350857 42.020571-17.188571 90.660571-25.965714 145.92-26.368 1.718857 0 8.155429 0.438857 19.309714 1.28 11.556571 0.438857 25.709714 2.377143 42.422857 5.778285 16.713143 2.998857 34.925714 8.155429 54.637714 15.433143 19.748571 6.875429 39.204571 16.493714 58.514286 28.928l-10.313143-79.067428 253.952-17.371429c-5.12 123.026286-7.716571 245.394286-7.716571 367.104v84.187429l1.28 78.445714 2.56 78.409143c1.28 26.148571 2.56 53.796571 3.876571 82.944l-206.994285 13.531428z m-300.251429-155.574857a2826.130286 2826.130286 0 0 0 150.454857-10.276572 1494.381714 1494.381714 0 0 0 145.92-21.211428c-1.28-53.138286-3.657143-104.594286-7.058286-154.294857-2.998857-49.737143-7.314286-100.498286-12.873142-152.356572h-36.644572c-41.545143 0-83.346286 1.499429-125.330286 4.498286a1429.942857 1429.942857 0 0 0-126.025142 13.531429c-5.12 44.982857-7.68 90.185143-7.68 135.606857 0 17.152 0.402286 33.243429 1.28 48.237714 0.841143 14.555429 1.901714 29.110857 3.181714 43.702857 1.718857 14.555429 3.657143 29.366857 5.814857 44.361143 2.56 14.994286 5.558857 31.085714 8.996571 48.201143z m1427.821714-480.182857c0 65.536-12.434286 122.331429-37.302857 170.349714a337.883429 337.883429 0 0 1-103.497143 120.832c-44.580571 32.182857-98.377143 57.234286-161.353143 75.227429-62.573714 17.993143-132.022857 29.549714-208.274285 34.742857 3.401143 34.669714 6.619429 70.217143 9.618285 106.678857 3.437714 35.986286 7.497143 74.130286 12.214858 114.432l-304.054858 21.211428c8.557714-110.153143 15.213714-219.648 19.931429-328.484571 5.12-109.312 7.68-219.245714 7.68-329.801143 0-28.708571-0.182857-54.857143-0.621714-78.445714 0-23.552-0.438857-46.482286-1.28-68.754286a1956.461714 1956.461714 0 0 0-2.56-68.790857c-1.28-23.588571-2.779429-49.92-4.498286-79.067429A954.148571 954.148571 0 0 1 1092.754286 28.891429c53.979429-6.838857 109.714286-10.276571 167.131428-10.276572 28.708571 0 59.794286 1.462857 93.220572 4.498286 33.426286 2.998857 66.633143 8.996571 99.657143 17.993143a450.56 450.56 0 0 1 95.780571 37.924571 283.867429 283.867429 0 0 1 81.627429 63.012572c23.990857 26.148571 43.081143 58.294857 57.234285 96.402285 14.116571 37.741714 21.211429 82.505143 21.211429 134.363429zM1174.418286 154.258286v119.588571a10434.377143 10434.377143 0 0 0 5.12 231.387429c1.755429 39.021714 3.876571 79.067429 6.473143 120.210285h23.771428c37.705143 0 75.629714-1.060571 113.773714-3.181714a1034.678857 1034.678857 0 0 0 108.653715-12.873143c5.997714-23.149714 10.276571-52.297143 12.873143-87.405714 2.998857-35.145143 4.498286-72.667429 4.498285-112.530286 0-24.868571-0.658286-49.92-1.938285-75.190857a1758.500571 1758.500571 0 0 0-5.12-72.667428 646.692571 646.692571 0 0 0-9.033143-64.292572c-3.437714-20.114286-7.277714-37.266286-11.556572-51.419428a242.724571 242.724571 0 0 0-21.211428-1.938286 480.365714 480.365714 0 0 0-26.331429-0.621714c-19.748571 0-41.179429 0.658286-64.329143 1.938285-22.674286 1.28-44.361143 2.56-64.914285 3.84l-70.729143 5.12z m3150.006857 564.406857c0 55.734857-11.154286 102.875429-33.426286 141.421714-21.869714 38.180571-52.516571 69.229714-91.940571 93.257143-38.985143 23.552-85.504 40.484571-139.483429 50.761143-54.016 10.715429-112.713143 16.091429-176.128 16.091428-28.745143 0-58.514286-2.816-89.380571-8.374857-30.866286-5.12-61.293714-13.531429-91.282286-25.088a485.449143 485.449143 0 0 1-86.125714-44.982857 354.413714 354.413714 0 0 1-73.947429-64.914286 386.56 386.56 0 0 1-54.637714-88.100571c-14.555429-32.987429-23.990857-70.290286-28.269714-111.835429l280.283428-5.778285c-0.877714 11.995429-1.316571 24.210286-1.316571 36.644571v38.546286c0 37.302857 1.316571 75.446857 3.876571 114.468571 25.270857 2.962286 50.578286 5.12 75.849143 6.4a1496.685714 1496.685714 0 0 0 151.076571 0 1181.988571 1181.988571 0 0 0 75.849143-6.436571c2.157714-14.555429 3.876571-28.708571 5.156572-42.422857 1.28-14.153143 1.938286-28.525714 1.938285-43.081143 0-23.552-1.499429-47.36-4.498285-71.350857a1067.629714 1067.629714 0 0 0-11.593143-72.009143c-29.988571-3.401143-64.512-7.277714-103.497143-11.556572a1416.886857 1416.886857 0 0 1-120.210286-18.651428 980.041143 980.041143 0 0 1-120.210285-33.426286 413.074286 413.074286 0 0 1-104.777143-55.296 272.091429 272.091429 0 0 1-74.605715-84.845714c-18.834286-33.426286-28.269714-73.910857-28.269714-121.490286 0-33.024 5.997714-63.012571 17.993143-90.002286a253.659429 253.659429 0 0 1 49.517714-72.009142 337.554286 337.554286 0 0 1 72.630857-55.954286 500.077714 500.077714 0 0 1 87.442286-39.168 599.405714 599.405714 0 0 1 185.782857-30.866286c64.694857 0 121.709714 10.057143 171.008 30.208 49.261714 20.114286 90.624 46.482286 124.050286 79.067429a347.245714 347.245714 0 0 1 78.445714 109.275428c18.432 40.740571 29.147429 81.444571 32.146286 122.148572l-293.814857 31.488c2.157714-16.274286 3.437714-32.548571 3.876571-48.822857 0.841143-16.713143 1.28-33.243429 1.28-49.517715 0-37.302857-2.56-74.971429-7.716571-113.152a503.222857 503.222857 0 0 0-43.702857-4.498285 712.777143 712.777143 0 0 0-43.081143-1.28 752.64 752.64 0 0 0-175.506286 21.211428c-0.841143 10.715429-1.28 21.211429-1.28 31.524572v30.208c0 29.988571 1.060571 59.574857 3.218286 88.685714 2.56 28.745143 7.277714 57.673143 14.153143 86.784l115.712 15.433143c41.545143 5.156571 83.126857 12.214857 124.708571 21.211428 41.984 8.594286 82.285714 19.529143 120.868572 32.804572 38.985143 12.836571 73.252571 29.147429 102.838857 48.859428a236.470857 236.470857 0 0 1 72.009143 70.692572c17.993143 27.428571 26.989714 60.013714 26.989714 97.718857z" fill="#051360" p-id="3777"></path><path d="M2307.766857 1008.64c0-12.434286-0.182857-24.868571-0.621714-37.302857a1140.224 1140.224 0 0 1-0.658286-37.924572 259.730286 259.730286 0 0 1-71.314286 46.957715c-24.466286 10.24-46.957714 17.993143-67.510857 23.149714a345.490286 345.490286 0 0 1-71.387428 10.24c-42.861714 0-84.187429-6.582857-124.050286-19.894857a310.198857 310.198857 0 0 1-105.435429-58.514286c-30.866286-26.148571-55.954286-58.697143-75.227428-97.718857-18.834286-39.424-29.366857-85.065143-31.488-136.923429 0-52.297143 7.058286-99.84 21.211428-142.701714 14.153143-43.300571 35.364571-80.347429 63.634286-111.213714 28.306286-30.866286 63.451429-54.637714 105.435429-71.350857 41.984-17.188571 90.660571-25.965714 145.92-26.368 1.718857 0 8.155429 0.438857 19.309714 1.28a266.24 266.24 0 0 1 42.422857 5.778285 324.388571 324.388571 0 0 1 54.637714 15.433143 274.651429 274.651429 0 0 1 58.514286 28.928L2260.845714 321.462857l253.952-17.371428c-5.156571 123.026286-7.716571 245.394286-7.716571 367.104v84.187428l1.28 78.445714 2.56 78.409143c1.28 26.148571 2.56 53.796571 3.876571 82.944l-206.994285 13.531429z m-300.214857-155.574857a2825.654857 2825.654857 0 0 0 150.454857-10.276572 1494.198857 1494.198857 0 0 0 145.92-21.211428 3460.022857 3460.022857 0 0 0-7.058286-154.294857 3266.56 3266.56 0 0 0-12.873142-152.356572h-36.644572c-41.545143 0-83.382857 1.499429-125.366857 4.498286-41.545143 2.56-83.565714 7.094857-125.988571 13.531429-5.12 44.982857-7.68 90.185143-7.68 135.606857 0 17.152 0.365714 33.243429 1.243428 48.237714 0.877714 14.555429 1.938286 29.110857 3.218286 43.702857 1.718857 14.555429 3.657143 29.366857 5.778286 44.361143 2.56 14.994286 5.595429 31.085714 8.996571 48.201143z" fill="#1F4CCA" p-id="3778"></path><path d="M3162.770286 1008.64c0-12.434286-0.182857-24.868571-0.621715-37.302857a1140.224 1140.224 0 0 1-0.658285-37.924572 259.730286 259.730286 0 0 1-71.314286 46.957715c-24.466286 10.24-46.957714 17.993143-67.547429 23.149714a345.453714 345.453714 0 0 1-71.314285 10.24c-42.898286 0-84.224-6.582857-124.086857-19.894857a310.198857 310.198857 0 0 1-105.435429-58.514286c-30.866286-26.148571-55.954286-58.697143-75.227429-97.718857-18.834286-39.424-29.366857-85.065143-31.488-136.923429 0-52.297143 7.058286-99.84 21.211429-142.701714 14.153143-43.300571 35.364571-80.347429 63.634286-111.213714 28.306286-30.866286 63.451429-54.637714 105.435428-71.350857 41.984-17.188571 90.624-25.965714 145.92-26.368 1.718857 0 8.155429 0.438857 19.309715 1.28a266.24 266.24 0 0 1 42.422857 5.778285c16.713143 2.998857 34.925714 8.155429 54.637714 15.433143a274.651429 274.651429 0 0 1 58.514286 28.928l-10.313143-79.067428 253.952-17.371429c-5.156571 123.026286-7.716571 245.394286-7.716572 367.104v84.187429l1.28 78.445714 2.56 78.409143c1.28 26.148571 2.56 53.796571 3.876572 82.944l-206.994286 13.531428z m-300.214857-155.574857a2825.654857 2825.654857 0 0 0 150.454857-10.276572 1494.308571 1494.308571 0 0 0 145.92-21.211428c-1.28-53.138286-3.657143-104.594286-7.058286-154.294857a3266.56 3266.56 0 0 0-12.873143-152.356572H3102.354286c-41.581714 0-83.382857 1.499429-125.366857 4.498286-41.545143 2.56-83.565714 7.094857-125.988572 13.531429-5.12 44.982857-7.68 90.185143-7.68 135.606857 0 17.152 0.365714 33.243429 1.243429 48.237714 0.877714 14.555429 1.938286 29.110857 3.218285 43.702857 1.718857 14.555429 3.657143 29.366857 5.778286 44.361143 2.56 14.994286 5.595429 31.085714 8.996572 48.201143z" fill="#05DDB9" p-id="3779"></path></svg>
)

const { Dragger } = Upload;

const AboutTab = ({ currentPlatformVersion }) => {
  return (
    <>
      <p style={{textAlign: 'center', fontSize: 32, fontWeight: 700, display: 'flex', alignItems:'center', justifyContent: 'center'}}> 
      <span style={{ marginRight: 8 }}>
        { APaaS }
      </span>
       Platform</p>
       <div style={{display: 'flex', alignItems: 'center', flexDirection: 'column', padding: '10px 0', height: 100, justifyContent: 'space-around'}}>
        <p style={{textAlign: 'center'}}>当前版本是： <span style={{color: 'rgb(22, 119, 255)'}}>{currentPlatformVersion}</span></p>
        <p style={{ textAlign: 'center', color: '#777' }}>开源、开放、免费的企业级通用无代码aPaaS平台</p>
        <div>
          <a href="https://github.com/mybricks" target="_blank">@2020 板砖团队</a>
        </div>
       </div>
    </>
  )
}

const UpgradeTab = ({ currentPlatformVersion, appCtx }) => {
  const [showUpgrade, setShowUpgrade] = useState(false)
  const [checkLoading, setCheckLoading] = useState(false)
  const [versionCompareResult, setVersionCompareResult] = useState(null);
  const [upgradeInfo, setUpgradeInfo] = useState(null)
  const [isDownloading, setIsDownloading] = useState(false)
  let upgradeContainer = null;

  const uploadProps = {
		multiple: false,
		maxCount: 1,
		showUploadList: true,
		action: `/paas/api/system/offlineUpdate?userId=${appCtx.user?.id}`,
		onChange(info) {
			const { status } = info.file;
			if (status === 'done') {
				message.destroy()
				message.success(`上传成功，正在安装中, 请稍后(大概10s)`, 10);
				setTimeout(() => {
					message.success(`安装成功, 即将自动刷新`);
					setTimeout(() => {
						location.reload();
					}, 1000)
				}, 10 * 1000)
			} else if (status === 'error') {
				message.destroy()
				message.error(`上传失败`);
			}
		},
		onDrop(e) {
			console.log('Dropped files', e.dataTransfer.files);
		},
	};

  const upgrade = useCallback((version) => {
    setIsDownloading(true)
      message.info('正在执行下载操作, 此过程大约15s', 15)
      axios.post('/paas/api/system/channel', {
        type: 'downloadPlatform',
        version: version,
        userId: appCtx.user?.id,
      }).then((res) => {
        if(res?.data?.code === 1) {
          message.info('安装包下载完毕，即将执行升级操作，请稍后', 5)
          axios.post('/paas/api/system/channel', {
            type: 'reloadPlatform',
            version: version,
            userId: appCtx.user?.id,
          }).then((res) => {
            setTimeout(() => {
              message.info('升级中，请稍后，此过程大约15s', 15, () => {
                message.success('升级成功, 3秒后将自动刷新页面', 3, () => {
                  location.reload()
                  setIsDownloading(false)
                })
              })
            }, 3000)
          }).catch(e => {
            setIsDownloading(false)
            console.log(e)
          })
        } else {
          setIsDownloading(false)
          message.info(res?.data?.msg || '下载失败，请稍后重试')
        }
      }).catch(e => {
        setIsDownloading(false)
        console.log(e)
      })
  }, [])
  
  if(showUpgrade) {
    // console.log(111, versionCompareResult)
    upgradeContainer = (
      <div style={{display: 'flex', justifyContent: 'space-around', alignItems:'center', marginTop: 8}}>
        {
          versionCompareResult > 0 ? (
            <div style={{display: 'flex', justifyContent: 'space-around', alignItems:'center', width: 300}}>
              <span>最新版本是: <span style={{ color: 'rgb(255, 77, 79)' }}>{upgradeInfo.version}</span></span>
              <Button 
                loading={isDownloading}
                icon={<ThunderboltOutlined />}
                onClick={() => {
                  upgrade(upgradeInfo.version)
                }}
              >
                立即升级
              </Button>
            </div>
          ) : null
        }
        {
          upgradeInfo?.previousList?.length > 0 ? (
            <Popover 
              content={(
                <div
                  style={{display: 'flex', flexDirection: 'column'}} 
                  onClick={(e) => {
                    e.stopPropagation()
                    // @ts-ignore
                    const currentApp = upgradeInfo?.previousList?.[e.target?.dataset?.index];
                    upgrade(currentApp.version)
                  }}>
                    {
                      upgradeInfo?.previousList?.map((item, index) => {
                        return (
                          <p data-index={index} style={ isDownloading ? {marginTop: 8, color: 'gray', cursor: 'not-allowed'} : {marginTop: 8, color: '#ff4d4f', cursor: 'pointer'}}>回滚到：{item.version} 版本</p>
                        )
                      })
                    }
                  </div>
              )} 
              title="历史版本" 
              trigger="click"
            >
              <Button
                type={"link"}
                disabled={isDownloading}
                className={styles.button}
                style={{ marginLeft: 10 }}
              >
                历史版本
              </Button>
            </Popover>
          ) : null
        }
      </div>
    )
  }
  return (
    <div>
			<p style={{height: 32, fontSize: 16, fontWeight: 'bold', textAlign: 'center', marginTop: 10}}>
				在线更新&nbsp;
				<Popover
					content={'需要能够访问公网环境，点击下面检查更新按钮，即可在线更新'}
					trigger="hover"
				>
					<QuestionCircleOutlined />
				</Popover>
			</p>
      <div style={{display: 'flex', justifyContent: 'center', marginTop: 8}}>
        <Button
          loading={checkLoading}
          type='primary'
          icon={<GlobalOutlined />}
          onClick={() => {
            setCheckLoading(true)
            axios.post('/paas/api/system/channel', {
              type: "checkLatestPlatformVersion",
              userId: appCtx.user?.id,
            }).then(({ data }) => {
              if(data.code === 1) {
                const temp = compareVersion(data.data.version, currentPlatformVersion)
                setVersionCompareResult(temp)
                switch(temp) {
                  case -1: {
                    message.info('远程系统版本异常，请联系管理员')
                    break;
                  }
                  case 0: {
                    message.info('当前版本已是最新版本')
                    setUpgradeInfo(data.data)
                    setShowUpgrade(true)
                    break;
                  }
                  case 1: {
                    setUpgradeInfo(data.data)
                    setShowUpgrade(true)
                    break
                  }
                }
              } else {
                message.info(data.msg)
              }
              setCheckLoading(false)
            })
          }}
        >
            检查更新
          </Button>
      </div>
      {upgradeContainer}
      {
        !appCtx?.systemConfig?.closeOfflineUpdate ? (
          <>
            <p style={{height: 32, fontSize: 16, fontWeight: 'bold', textAlign: 'center', marginTop: 10}}>
              离线更新&nbsp;
              <Popover
                content={'不需要能够访问公网环境，拖入平台安装包即可上传进行平台更新'}
                trigger="hover"
              >
                <QuestionCircleOutlined />
              </Popover>
            </p>
            <Dragger 
              {...uploadProps}
            >
              <p className="ant-upload-drag-icon">
                <InboxOutlined />
              </p>
              <p className="ant-upload-text">拖拽 平台安装包 至此</p>
              <p className="ant-upload-hint">
              </p>
            </Dragger>
          </>
        ) : null
      }
    </div>
  )
}

const LicenseTab = ({ appCtx }) => {
  const [activateInfoLoading, setActivateInfoLoading] = useState(false)
  const [isActivated, setIsActivated] = useState(false)
  const [activateInfo, setActivateInfo] = useState({} as any)
  const [licenseCode, setLicenseCode] = useState('')

  const _getLicenseInfo = useCallback(async () => {
    setActivateInfoLoading(true)
    axios({
      method: 'post',
      url: '/paas/api/license/getActivateInfo',
    }).then(({ data }) => {
      if(data.code === 1) {
        setActivateInfo(data.data)
        setIsActivated(true)
      } else {
        setIsActivated(false)
      }
    }).finally(() => {
      setActivateInfoLoading(false)
    })
  }, [])

  useEffect(() => {
    _getLicenseInfo()
  }, [])

  const submitLicense = useCallback(async () => {
    const res: any = await axios({
      method: 'post',
      url: '/paas/api/license/activate',
      data: {
        userId: appCtx.user.id,
        licenseCode: licenseCode,
      },
    })

    const { code, msg } = res?.data || {}
    if (code === 1) {
      message.success(msg || '激活成功')
    } else {
      message.error(msg)
    }
    await _getLicenseInfo()
  }, [licenseCode])

  if(activateInfoLoading) {
    return (
      <div>
        <p>查询中，请稍后... <LoadingOutlined /></p>
      </div>
    )
  }

  return (
    <div>
      {
        isActivated ? (
          <div>
            <p style={{textAlign: 'center', fontSize: '20px', fontWeight: 'bold', marginBottom: '6px'}}>{activateInfo.status}</p>
            <p style={{textAlign: 'center'}}>您当前使用的版本为：<span style={{ fontWeight: 'bold', fontSize: 18 }}>{activateInfo.type}</span>，有效期至 <span style={{ fontWeight: 'bold', fontSize: 18 }}>{activateInfo.expiredDate}</span></p>
            <div style={{ display: 'flex', justifyContent: 'space-around', marginTop: '10px' }}>
              <Button icon={<EnterOutlined />} type="primary" onClick={() => {
                setIsActivated(false)
              }} >重新激活</Button>
            </div>
          </div>
        ) : (
          <div>
            <p style={{textAlign: 'center', fontSize: '20px', fontWeight: 'bold', marginBottom: '6px'}}>未激活</p>
            <Input.TextArea 
              rows={8} 
              value={licenseCode} 
              onChange={(e) => {
                // console.log(e.target.value); 
                setLicenseCode(e.target.value)
                console.log(licenseCode)
              }} 
              placeholder='请输入秘钥'
            />
            <div style={{ display: 'flex', justifyContent: 'space-around', marginTop: '10px' }}>
              <Button target='blank' type='link' href='https://www.mybricks.world/' icon={<MessageOutlined />}>联系客服获取秘钥</Button>
              <Button icon={<EnterOutlined />} type="primary" onClick={submitLicense} >激活</Button>
            </div>
          </div>
        )
      }
    </div>
  )

}

const AboutForm = ({ currentPlatformVersion }) => {
  // const appCtx = observe(AppCtx, {from: 'parents'})
  const user = useUserContext()
  const { system } = useAppConetxt();

  const appCtx = {
    user,
    systemConfig: system
  }

  const items = [
    {
      key: 'about',
      label: '关于',
      children: <AboutTab currentPlatformVersion={currentPlatformVersion}/>
    },
    {
      key: 'upgrade',
      label: '升级',
      children: <UpgradeTab currentPlatformVersion={currentPlatformVersion} appCtx={appCtx} />
    },
    {
      key: 'license',
      label: '我的许可',
      children: <LicenseTab appCtx={appCtx} />,
    }
  ];

  return (
    <div>
      <Tabs defaultActiveKey="upgrade" destroyInactiveTabPane={true} items={items} onChange={() => {}} />
    </div>
  )
}

export default AboutForm