import { type MsgResourceData } from "../classes/MsgResource";

export const testData: MsgResourceData = {
  title: 'TestResource',
  attributes: {
    lang: 'en',
    dir: 'ltr'
  },
  notes: [
    {type: 'DESCRIPTION', content: 'This is test data'},
    {type: 'AUTHORSHIP', content: 'Mr. Tester'}
  ],
  messages: [
    {
      key: 'test-1',
      value: 'This is test 1',
      notes: [
        {type: 'DESCRIPTION', content: 'This is the test-1 message.'}
      ]
    },
    {
      key: 'test-2',
      value: 'This is test 2',
      notes: [
        {type: 'DESCRIPTION', content: 'This is the test-2 message.'}
      ]
    },
    {
      key: 'test-3',
      value: 'This is test 3',
      notes: [
        {type: 'DESCRIPTION', content: 'This is the test-3 message.'}
      ]
    }
  ]
}