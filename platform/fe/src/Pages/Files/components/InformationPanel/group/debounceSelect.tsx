import React, { useMemo, useRef, useState } from 'react';
import debounce from 'lodash/debounce';
import { Select, Spin } from 'antd';
import axios from 'axios'

function DebounceSelect({ fetchOptions, debounceTimeout = 800, ...props }) {
  const [fetching, setFetching] = useState(false);
  const [options, setOptions] = useState([]);
  const fetchRef = useRef(0);

  const debounceFetcher = useMemo(() => {
    const loadOptions = (value: string) => {
      fetchRef.current += 1;
      const fetchId = fetchRef.current;
      setOptions([]);
      setFetching(true);

      fetchOptions(value).then((newOptions) => {
        if (fetchId !== fetchRef.current) {
          // for fetch callback order
          return;
        }

        setOptions(newOptions);
        setFetching(false);
      });
    };

    return debounce(loadOptions, debounceTimeout);
  }, [fetchOptions, debounceTimeout]);

  return (
    <Select
      labelInValue
      filterOption={false}
      onSearch={debounceFetcher}
      notFoundContent={fetching ? <Spin size="small" /> : null}
      {...props}
      options={options}
    />
  );
}

// Usage of DebounceSelect
interface UserValue {
  label: string;
  value: string;
}

async function fetchUserList(username: string): Promise<UserValue[]> {
  return axios.post(`/paas/api/user/searchByKeyword`, {
    keyword: username
  }).then(({data}) => {
    if(data.code === 1) {
      return data.data.map((item) => {
        return {
          label: `${item.name}${item.email ? `(${item.email})` : ''}`,
          value: item.id
        }
      })
    }
  })
}

const CustomDebounceSelect = (props) => {
  const [value, setValue] = useState<UserValue[]>([]);
  return (
    <DebounceSelect
      mode="multiple"
      value={value}
      placeholder="请输入用户名"
      fetchOptions={fetchUserList}
      onChange={(newValue) => {
        setValue(newValue);
        props.onChange(newValue);
      }}
      style={{ width: '100%' }}
    />
  );
};

export default CustomDebounceSelect;