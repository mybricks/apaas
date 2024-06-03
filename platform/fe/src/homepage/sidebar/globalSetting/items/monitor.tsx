import React, { useEffect, useState } from 'react';
import axios from 'axios'
import {getApiUrl} from '../../../../utils'

// 引入 echarts 核心模块，核心模块提供了 echarts 使用必须要的接口。
import * as echarts from 'echarts/core';
// 引入柱状图图表，图表后缀都为 Chart
import { BarChart } from 'echarts/charts';
// 引入提示框，标题，直角坐标系，数据集，内置数据转换器组件，组件后缀都为 Component
import {
  TitleComponent,
  TooltipComponent,
  GridComponent,
  DatasetComponent,
  TransformComponent
} from 'echarts/components';
// 标签自动布局、全局过渡动画等特性
import { LabelLayout, UniversalTransition } from 'echarts/features';
// 引入 Canvas 渲染器，注意引入 CanvasRenderer 或者 SVGRenderer 是必须的一步
import { CanvasRenderer } from 'echarts/renderers';
import { Select, message } from 'antd';


// 注册必须的组件
echarts.use([
  TitleComponent,
  TooltipComponent,
  GridComponent,
  DatasetComponent,
  TransformComponent,
  BarChart,
  LabelLayout,
  UniversalTransition,
  CanvasRenderer
]);

let ChartIns;

function Monitor() {
  const [options, setOptions] = useState([]);
  const [selectDate, setSelectDate] = useState(null);
  const [graphData, setGraphData] = useState({});

  useEffect(() => {
    // 基于准备好的dom，初始化echarts实例
    ChartIns = echarts.init(document.getElementById('mybricks-monitor-root'));
    axios.post(getApiUrl('/paas/api/log/runtimeLog/monitor/interfacePerformanceList')).then(({ data }) => {
      if(data.code === 1) {
        const ops = data?.data?.map((item) => {
          return {
            value: item,
            label: item,
          }
        })
        setOptions(ops || [])
      } else {
        message.info(data.msg || '获取数据失败')
      }
    }).catch(e => {
      console.log(e)
      message.warn(e.message || '获取接口列表失败')
    })

  }, [])

  const refreshChart = ({ title, xData, yData }) => {
    ChartIns.setOption({
      title: {
        text: title,
        // textAlign: 'center',
      },
      tooltip: {},
      xAxis: {
        // data: ['/paas/api/1', '/paas/api/2', '/paas/api/3', '/paas/api/4', '/paas/api/5', '/paas/api/1', '/paas/api/2', '/paas/api/3', '/paas/api/4', '/paas/api/5']
        data: xData
      },
      yAxis: {},
      series: [
        {
          name: '性能',
          type: 'bar',
          data: yData
          // data: [51, 20, 36, 10, 10,51, 20, 36, 10, 10]
        }
      ]
    });
  }

  const getData = ({ date }) => {
    axios.post(getApiUrl('/paas/api/log/runtimeLog/monitor/interfacePerformanceDetail'), {
      date: date
    }).then(({ data }) => {
      console.log(data)
      if(data.code === 1) {
        refreshChart({
          title: `接口性能监控（${date}）`,
          xData: Object.keys(data.data.detail),
          yData: Object.values(data.data.detail)
        })
        setGraphData(data.data)
      } else {
        message.info(data.msg || '获取数据失败')
      }
    }).catch(e => {
      console.log(e)
      message.warn(e.mgs || '获取接口列表失败')
    })
  }

  return (
    <div style={{width: '100%', height: 600}}>
      <div style={{margin: "8px 0"}}>
        <span>筛选日期：</span>
        <Select
          style={{ width: 120 }}
          placeholder="请选择日期"
          onChange={(i) => {
            setSelectDate(i)
            getData({ date: i })
          }}
          options={options}
        />
        {
          graphData?.result?.averageCost ? (
            <span style={{marginLeft: 12}}>平均性能为：{graphData?.result?.averageCost?.toFixed(2)} ms</span>
          ) : null
        }
      </div>
      <div style={{width: '100%', height: 600}} id="mybricks-monitor-root"></div>
    </div>
  )
}

export default Monitor