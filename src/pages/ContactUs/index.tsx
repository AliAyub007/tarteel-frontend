import React from 'react';
import styled from 'styled-components';
import { injectIntl, InjectedIntl } from 'react-intl';
import { withCookies } from 'react-cookie';
import pick from 'lodash/pick';
import ReactNotification from 'react-notifications-component';
import validate from 'validate.js';
import Helmet from 'react-helmet';

import Navbar from '../../components/Navbar';
import SocialLinksFooter from '../../components/SocialLinksFooter';
import Input from '../../components/Input';
import FooterButton from '../../components/FooterButton';
import T from '../../components/T';
import KEYS from '../../locale/keys';
import Select from '../../components/Select';
import { sendEmail } from '../../api/auth';

const subjects: ISubject[] = [
  {
    label: 'Bug Report',
    value: 'bug',
  },
  {
    label: 'Question',
    value: 'question',
  },
  {
    label: 'Feature request',
    value: 'featureRequest',
  },
  {
    label: 'Partnership',
    value: 'partnership',
  },
  {
    label: 'Other',
    value: 'other',
  },
];

interface IProps {
  intl: InjectedIntl;
}

interface ISubject {
  label: string;
  value: string;
}

interface IState {
  subject: ISubject;
  email: string;
  message: string;
  receivers: string[];
  isLoading: boolean;
}

class ContactUs extends React.Component<IProps, IState> {
  state = {
    subject: subjects[0],
    email: '',
    message: '',
    receivers: ['info@tarteel.io'],
    isLoading: false,
  };

  notificationDOMRef: JSX.Element;

  handleChange = e => {
    this.setState({
      [e.target.name]: e.target.value,
    });
  };
  showToast = (type: string, title: string, message: string) => {
    if (this.notificationDOMRef) {
      this.notificationDOMRef.addNotification({
        title,
        message,
        type,
        insert: 'top',
        container: 'top-right',
        animationIn: ['animated', 'fadeIn'],
        animationOut: ['animated', 'fadeOut'],
        dismiss: { duration: 2000 },
        dismissable: { click: true },
      });
    }
  };
  validateForm = (body: object) => {
    const constraints = {
      email: {
        presence: { allowEmpty: false },
        email: true,
      },
      message: {
        presence: { allowEmpty: false },
      },
    };

    return validate(body, constraints);
  };
  handleSubmit = () => {
    const body = pick(this.state, 'subject', 'email', 'message', 'receivers');
    const errors = this.validateForm(body);
    if (!errors) {
      this.setState({ isLoading: true });
      body.subject = body.subject.value;
      return sendEmail(body)
        .then(res => res.json())
        .then(json => {
          if (json.statusCode === 200) {
            this.showToast('success', 'Succeed', 'Message has been sent');
          } else if (json.errorMessage) {
            this.showToast('danger', 'Error', json.errorMessage);
          }
          this.setState({ isLoading: false });
        })
        .catch(e => {
          this.setState({ isLoading: false });
          this.showToast('danger', 'Error', e.message);
        });
    } else {
      Object.keys(errors).map((key: string) => {
        this.showToast('danger', 'Error', errors[key][0]);
      });
    }
  };
  render() {
    const { intl } = this.props;
    const rtl = this.props.cookies.get('currentLocale') === 'ar';
    return (
      <Container>
        <Helmet>
          <title>
            {intl.formatMessage({ id: KEYS.CONTACT_US_PAGE_TITLE })}
          </title>
        </Helmet>
        <Navbar />
        <div className="content">
          <div className="contact-us-email">
            <T id={KEYS.CONTACT_US_EMAIL_TEXT} />
          </div>
          <div className="form">
            <div className="select-container">
              <label>
                <T id={KEYS.CONTACT_US_SUBJECT} />
              </label>
              <Select
                isRtl={Boolean(rtl)}
                isSearchable={true}
                defaultValue={subjects[0]}
                className={'select'}
                options={subjects}
                onChange={option => this.setState({ subject: option })}
              />
            </div>
            <Input
              placeholder={intl.formatMessage({
                id: KEYS.EMAIL_ADDRESS_INPUT_PLACEHOLDER,
              })}
              label={intl.formatMessage({
                id: KEYS.EMAIL_ADDRESS_INPUT_LABEL,
              })}
              name={'email'}
              onChange={this.handleChange}
            />
            <Input
              placeholder={intl.formatMessage({
                id: KEYS.MESSAGE_TEXTAREA_PLACEHOLDER,
              })}
              label={intl.formatMessage({
                id: KEYS.MESSAGE_TEXTAREA_LABEL,
              })}
              name={'message'}
              type={'textarea'}
              cols="30"
              rows="10"
              onChange={this.handleChange}
            />
            <FooterButton
              onClick={this.handleSubmit}
              isLoading={this.state.isLoading}
              afterLoadingMessage={'Sent!'}
            >
              <T id={KEYS.CONTACT_US_SEND} />
            </FooterButton>
          </div>
        </div>
        <ReactNotification
          ref={(C: JSX.Element) => (this.notificationDOMRef = C)}
        />
        <SocialLinksFooter />
      </Container>
    );
  }
}

const Container = styled.div`
  padding: 1em;
  display: flex;
  flex-flow: column;
  height: 100%;
  box-sizing: border-box;

  .content {
    padding: 1em;
    padding-top: 2em;
    flex: 1;
    display: flex;
    flex-flow: column;
    position: relative;
    box-sizing: border-box;

    .form {
      display: flex;
      flex-flow: column;
      justify-content: center;
      align-items: center;

      label {
        margin-bottom: 5px;
        font-size: 16px;
        display: inline-block;
      }
      .select {
        width: 320px;
        margin-bottom: 15px;
      }
    }
    
    .contact-us-email {
      text-align: center;
      margin-bottom: 50px;
      a {
        color: #5ec49e;
        text-decoration: underline;
      }
    }
  }

  @media screen and (max-width: ${props => props.theme.breakpoints.sm}px) {
    .content {
      width: 100%;

      .select {
        width: 200px;
      }
    }
  }
`;

export default withCookies(injectIntl(ContactUs));
